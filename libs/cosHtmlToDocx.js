'use strict';

/**
 * Convert HTML to docx
 */

const docx = require('docx');

// Used to create docx files
const htmlparser = require('htmlparser2');
const decode = require('html-entities').decode;
const fs = require('fs');
const fsExtra = require('fs-extra');
const https = require('https');
const path = require('path');
const sizeOf = require('image-size');
const mime = require('mime-types');
const {AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun, ImageRun, ExternalHyperlink, LevelFormat} = docx;

const _addStyles = function (params) {
    params.styles = {
        paragraphStyles: [{
            id: 'code',
            name: 'code',
            basedOn: 'Normal',
            next: 'Normal',
            run: {
                size: 24,
                font: 'Courier New'
            }
        }]
    }
    params.numbering = {
        config: [
            {
                reference: "numberLi",
                levels: [
                    {
                        level: 0,
                        text: "%1.",
                        format: "decimal",
                        alignment: AlignmentType.LEFT,
                    },
                    {
                        level: 1,
                        text: "%1.%1.",
                        format: "decimal",
                        alignment: AlignmentType.LEFT,
                    },
                    {
                        level: 2,
                        text: "%1.%1.%1",
                        format: "decimal",
                        alignment: AlignmentType.LEFT,
                    },
                ],
            },
            {
                reference: "bullet",
                levels: [
                    {
                        level: 0,
                        format: LevelFormat.BULLET,
                        alignment: AlignmentType.LEFT,
                        style: {
                            paragraph: {
                                indent: {
                                    left: 720,
                                    hanging: 260
                                },
                            },
                        },
                    },
                    {
                        level: 1,
                        format: LevelFormat.BULLET,
                        alignment: AlignmentType.LEFT,
                        style: {
                            paragraph: {
                                indent: {
                                    left: 1440,
                                    hanging: 980
                                },
                            },
                        },
                    },
                    {
                        level: 2,
                        format: LevelFormat.BULLET,
                        alignment: AlignmentType.LEFT,
                        style: {
                            paragraph: {
                                indent: {
                                    left: 2160,
                                    hanging: 1700
                                },
                            },
                        },
                    },
                ],
            },
        ],
    }
};

const colors = {
    black: '000000',
    red: 'FF0000',
    green: '008000',
    blue: '0000FF',
    yellow: 'FFFF00',
    orange: 'FFA500'
};

const findItemByProperty = function (items, text, property) {
    property = property || 'name';
    if (!items) {
        return;
    }

    for (const item of items) {
        // Test current object
        if (item[property] === text) {
            return item;
        }

        // Test children recursively
        const child = findItemByProperty(item.children, text, property);
        if (child) {
            return child;
        }
    }
};

const getFilesPath = function (pathIn) {
    let pathOut = pathIn || 'files';
    if (path.basename(pathOut).indexOf('.') > -1) {
        pathOut = pathOut.replace(path.basename(pathOut), '');
    }

    return pathOut;
};

const getFileNameFromPath = function (path) {
    if (!path) {
        return null;
    }
    const pathSanitized = path.replace(/\\/g, '_');
    if (pathSanitized.indexOf('data') === 0) {
        const name = pathSanitized.split(';base64,').pop().substr(0, 7).replace(/\//g, '_');
        const extension = pathSanitized.split(';base64,')[0].split('/')[1];
        return name + '.' + extension;
    }

    return pathSanitized.split('/').pop().split('#')[0].split('?')[0];
};

const validateFilename = (name) => {
    const mimetype = mime.lookup(name);
    if (mimetype && mimetype.indexOf('image/') === 0) {
        return true;
    }

    return false;
}
const getImageFile = async function (url, dirpath) {
    const fileDirPath = getFilesPath(dirpath);

    return new Promise(function (resolve, reject) {
        return fsExtra.ensureDir(fileDirPath, {mode: '0760'}, function () {
            const filename = getFileNameFromPath(url);
            const filepath = path.join(fileDirPath, filename);
            try {
                if (validateFilename(filename)) {
                    if (url.indexOf('data') === 0) {
                        const imageData = url.split(';base64,').pop();
                        fs.writeFile(filepath, imageData, {encoding: 'base64'}, function (err) {
                            if (err) {
                                console.log(err);
                                fs.unlink(filepath, function () {
                                    return reject(err);
                                });
                            }

                            return resolve(filepath);
                        });
                    } else {
                        const file = fs.createWriteStream(filepath);
                        https.get(url, function (response) {
                            response.pipe(file);
                            file.on('finish', function () {
                                file.close();

                                return resolve(filepath);
                            });
                        }).on('error', function (err) { // Handle errors
                            console.log(err);
                            fs.unlink(filepath, function () {
                                return reject(err);
                            });
                        });
                    }
                } else return resolve(false);
            } catch (err) {
                console.log(err)
                return reject(err);
            }
        });
    });
};

const findItemByClass = function (item, className) {
    if (!item) {
        return;
    }
    if (item.attribs && item.attribs.class === className) {
        return item;
    }
    if (item.children) {
        for (let i = 0; i < item.children.length; i++) {
            const citem = item.children[i];
            // Test current object
            if (citem.attribs && citem.attribs.class === className) {
                return citem;
            }

            // Test children recursively
            const child = findItemByClass(citem, className);
            if (child) {
                i = item.children.length;

                return child;
            }
        }
    }


};

/**
 * @param {string} html  Html of the document
 * @param {string} title title of the docx document
 * @param {string} resPath Path where to save the docx
 * @returns {object} Html to docx object
 */
function CosHtmlToDocx (html, title, resPath) {
    this.html = html;
    this.path = resPath;
    const finalParagraphs = [];
    let params = {
        creator: 'citizenos.com',
        sections: []
    };
    if (title) {
        params.title = title;
    }
    _addStyles(params);

    const _isElement = (element, name) => {
        if (element.type === 'tag' && element.name) {
            return element.name === name;
        }

        return false;
    }

    const _isHeadingElement = (element) => {
        if (element.name) {
            return element.name.match(/h+[0-6]/gi);
        }

        return false;
    };

    const _isAlignmentElement = (element) => {
        let isAlign = false;
        if (element.attribs && element.attribs.class) {
            ['left', 'center', 'right'].forEach((align) => {
                if (element.attribs.class.indexOf(align) > -1) {
                    isAlign = true;
                }
            })
        }
        if (!isAlign && element.attribs && element.attribs.style) {
            isAlign = element.attribs.style.indexOf('text-align') > -1;
        }

        return isAlign;
    };

    const _isColorElement = (element) => {
        if (element.attribs && element.attribs.class) {
            return /color:[a-z]*/gi.test(element.attribs.class);
        }

        return false;
    };

    const _isListElement = (element) => {
        return (_isElement(element, 'ul') || _isElement(element, 'ol') || _isElement(element, 'li'));
    };

    const _isTextElement = (element) => {
        if (element.type === 'text') {
            return true;
        } else {
            const textelem = ['s', 'u', 'sup', 'em', 'strong', 'span', 'a'].filter((v) => {
                return _isElement(element, v) === true;
            });

            if (textelem.length || _isColorElement(element) || _isFontSizeElement(element))
                return true;

            return false;
        }
    };

    const _isParagraphElement = (element) => {
        return !_isTextElement(element);
    };

    const _isIndentListElement = (element) => {
        const item = findItemByClass(element, 'indent');

        if (item) {
            return true;
        }

        return false;
    };

    const _isBulletListElement = (element) => {
        return _isElement(element, 'ul') && element.attribs && element.attribs.class === 'bullet';
    };

    const _isFontSizeElement = (element) => {
        return element.attribs && element.attribs.class && element.attribs.class.match(/font-size/g);
    };

    const _isFootNoteElement = (element) => {
        return element.attribs && element.attribs.class && element.attribs.class.match(/fnEndLine/g);
    };

    const _handleHeadingAttributes = (element, attribs) => {
        if (_isHeadingElement(element)) {
            attribs.heading = HeadingLevel['HEADING_' + element.name.replace('h', '')]
        }
    };

    const _handleCodeAttributes = (element, attribs) => {
        if (_isElement(element, 'code')) {
            attribs.style = 'code';
        }
    }

    const _handleAlignAttributes = (element, attribs) => {
        if (_isAlignmentElement(element)) {
            let alignment = element.attribs.class.match(/(?:text-align:)([a-zA-Z]*)?/i);
            ['left', 'center', 'right'].forEach((align) => {
                if (element.attribs.class && element.attribs.class.indexOf(align) > -1) {
                    alignment = align;
                }
            });

            if (!alignment && element.attribs.style) {
                alignment = element.attribs.style.match(/(?:text-align:)([a-zA-Z]*)?/i);
                if (alignment.length) {
                    alignment = alignment[1];
                }
            }
            attribs.alignment = AlignmentType[alignment.toUpperCase()]
        }
    };

    const _getElementFontSizeFromStyle = (element) => {
        let size = element.attribs.class.match(/(?:font-size:)([0-9]*)?/i);
        if (size[1]) {
            size = (Math.round(size[1] * 0.75 * 2) / 2).toFixed(1); // pixels to pts

            return size * 2; // pts to half pts
        }
    };

    const _getItemDepth = (item, depth, isList) => {
        depth = depth || 0;
        if (item.parent && item.parent.name !== 'body') {
            if (!isList || (isList === true && _isListElement(item.parent) && item.parent.name !== 'li')) {
                depth++;
            }

            return _getItemDepth(item.parent, depth, isList);
        } else if (isList) {
            return depth;
        }
    };

    const _handleListElementAttributes = (element, attribs) => {
        let depth = null;
        if (_isBulletListElement(element)) {
            depth = _getItemDepth(element, null, true);
            if (!attribs.bullet)
                attribs.numbering = {
                    reference: "bullet",
                    level: depth
                };
        } else if (element.name && element.name === 'ol') {
            depth = _getItemDepth(element, null, true);
            if (!attribs.numbering)
                attribs.numbering = {
                    reference: "numberLi",
                    level: depth
                };
        } else if (_isIndentListElement(element)) {
            depth = _getItemDepth(element, null, true);
            if (!attribs.bullet)
                attribs.indent = {level: depth};
        }
    }

    const scaleImage = (path) => {
        try {
            let dimensions = sizeOf(path);
            if (dimensions.width > 605) {
                const scale = (605 / dimensions.width) * 100 / 100;
                dimensions.width = Math.round(dimensions.width * scale);
                dimensions.height = Math.round(dimensions.height * scale);
            }

            return dimensions;
        } catch (err) {
            console.log('ERROR', err);
            console.log(path);
            fs.unlink(path);
        }

    };

    const _getParagraphStyle = async function (item, attributes) {
        if (!attributes) {
            attributes = {};
        }
        _handleHeadingAttributes(item, attributes);
        _handleCodeAttributes(item, attributes);
        _handleAlignAttributes(item, attributes);
        _handleListElementAttributes(item, attributes);

        if (_isElement(item, 'img')) {
            const path = await getImageFile(item.attribs.src, resPath);
            if (path) {
                const imagesize = scaleImage(path);
                const image = {
                    children: [
                        new ImageRun({
                            data: fs.readFileSync(path),
                            transformation: {
                                width: imagesize.width,
                                height: imagesize.height,
                            },
                        })
                    ]
                };

                finalParagraphs.push(new Paragraph(image));
            }

            return null;
        }

        if (item.parent && item.parent.name !== 'body') {
            return await _getParagraphStyle(item.parent, attributes);
        }

        return attributes;
    };

    const _getTextWithFormat = async function (item, children, attributes) {
        if (!attributes) {
            attributes = {};
        }

        if (_isColorElement(item)) {
            const colorName = item.attribs.class.split('color:')[1];
            attributes.color = colors[colorName];
        } else if (_isElement(item, 'strong')) {
            attributes.bold = true;
        } else if (_isElement(item, 'sup')) {
            attributes.superScript = true;
        } else if (_isElement(item, 'em')) {
            attributes.italics = true;
        } else if (_isElement(item, 'u')) {
            attributes.underline = {};
        } else if (_isElement(item, 's')) {
            attributes.strike = {};
        } else if (_isFontSizeElement(item)) {
            attributes.size = _getElementFontSizeFromStyle(item);
        } else if (_isFootNoteElement(item)) {
            attributes.size = 17;
        } else if (_isElement(item, 'a')) {
            attributes.link = item.attribs.href;
            attributes.style = "Hyperlink";
        }

        if (item.type === 'text') {
            const textNode = attributes;
            textNode.text = decode(item.data);

            if (attributes.superScript && item.parent.name !== 'sup') {
                delete attributes.superScript;
            } else {
                children.push(new TextRun(textNode));
            }
        }
        if (item.children) {
            const linkChildren = [];
            for await (let gc of item.children) {
                if (_isElement(item, 'a')) {
                    await _getTextWithFormat(gc, linkChildren, attributes);
                }
                else if (!_isListElement(gc)) {
                    await _getTextWithFormat(gc, children, attributes);
                }
            }

            if (_isElement(item, 'a')) {
                children.push(new ExternalHyperlink({
                    children: linkChildren,
                    link: attributes.link,
                }));
            }
        } else {
            return attributes;
        }
    };

    const _childTagToFormat = async function (child, properties, isList) {

        await _getParagraphStyle(child, properties);
        if (child.children) {
            for await (const gchild of child.children) {
                await _getParagraphStyle(gchild, properties);
                await _getTextWithFormat(gchild, properties.children, null, isList);
            }
        }

        return properties;

    };

    const _listItems = function (element, items) {
        items = items || [];
        if (element.children) {
            for (const child of element.children) {
                if (_isTextElement(child) && element.name === 'li') {
                    items.push(element);

                    return items;
                } else if (_isHeadingElement(child) && element.name === 'li') {
                    items.push(child);

                    return items;
                }

                items = _listItems(child, items);
            }
        }

        return items;
    };

    const _listElementHandler = async function (element) {
        const liItems = _listItems(element);
        if (!liItems) return;
        for await (const li of liItems) {
            const children = [];
            await _getTextWithFormat(li, children);
            const paragrpahProperties = await _getParagraphStyle(li);
            paragrpahProperties.children = children

            finalParagraphs.push(new Paragraph(paragrpahProperties));

            if (li.children) {
                for await (const lic of li.children) {
                    await _listElementHandler(lic);
                }
            }
        }
    };


    /**
     * Iterates through all paragraphs and texts to return final structure and formatting of the document
     *
     * @param {array} paragraphs objects with formatting values
     *
     * @returns {Promise} Promise
     * @private
     */
    const _handleParserResult = async function (result) {
        const body = findItemByProperty(result, 'body');
        if (body && body.children) {
            let paragraphProperties;
            for await (const tag of body.children) {
                if (_isListElement(tag)) {
                    if (paragraphProperties) {
                        finalParagraphs.push(new Paragraph(paragraphProperties));
                        paragraphProperties = null;
                    }

                    await _listElementHandler(tag);
                } else if (_isParagraphElement(tag)) {
                    if (paragraphProperties) {
                        finalParagraphs.push(new Paragraph(paragraphProperties));
                        paragraphProperties = null;
                    }
                    const properties = await _childTagToFormat(tag, {
                        children: []
                    });
                    if (properties)
                        finalParagraphs.push(new Paragraph(properties))
                } else if (_isTextElement(tag)) {
                    if (!paragraphProperties) {
                        paragraphProperties = {
                            children: []
                        }
                    }
                    await _getTextWithFormat(tag, paragraphProperties.children);
                }
            }
            if (paragraphProperties)
                finalParagraphs.push(new Paragraph(paragraphProperties));
        }
    }

    /**
     * Return docx from input html
     *
     * @param {text} [html] text
     *
     * @returns {Promise}
     *
     * @public
     */

    this.processHTML = async function (html) {
        const processHtml = this.html || html;
        return new Promise(function (resolve, reject) {
            const handler = new htmlparser.DefaultHandler(async function (err, result) {
                if (err) {
                    return reject(err);
                }
                await _handleParserResult(result);
                params.sections = [{children: finalParagraphs}];

                const finalDoc = new Document(params);
                const b64string = await Packer.toBase64String(finalDoc);
                const buffer = Buffer.from(b64string, 'base64');

                return resolve(buffer);
            });
            const parser = new htmlparser.Parser(handler);
            parser.parseComplete(processHtml);
        })

    };
}


module.exports = CosHtmlToDocx;
