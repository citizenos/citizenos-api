'use strict';

/**
 * Convert HTML to docx
 */

const docx = require('docx');

// Used to create docx files
const htmlparser = require('htmlparser2');
const Promise = require('bluebird');
const encoder = require('html-entities').AllHtmlEntities;
const fs = require('fs');
const fsExtra = require('fs-extra');
const https = require('https');
const path = require('path');
const sizeOf = require('image-size');
const _ = require('lodash');
const { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun, UnderlineType, Numbering} = docx;

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
                        alignment: AlignmentType.LEFT,
                    },
                    {
                        level: 1,
                        text: "%1.",
                        alignment: AlignmentType.LEFT,
                    },
                    {
                        level: 2,
                        text: "%1.",
                        alignment: AlignmentType.LEFT,
                    },
                ],
            },
        ],
    }
};

const style = {
    a: {
        color: '0680FC'
    },
    b: {
        bold: true
    },
    u: {
        underline: true
    },
    em: {
        italics: true
    },
    s: {
        strikethrough: true
    },
    colors: {
        black: '000000',
        red: 'FF0000',
        green: '008000',
        blue: '0000FF',
        yellow: 'FFFF00',
        orange: 'FFA500'
    },
    align: ['center', 'justify', 'left', 'right'],
    headings: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
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
    if (path.indexOf('data') === 0) {
        const name = path.split(';base64,').pop().substr(0, 7).replace(/\//g, '_');
        const extension = path.split(';base64,')[0].split('/')[1];

        return name + '.' + extension;
    }

    return path.split('/').pop().split('#')[0].split('?')[0];
};

const getImageFile = async function (url, dirpath) {
    const fileDirPath = getFilesPath(dirpath);

    return new Promise(function (resolve, reject) {
        fsExtra.ensureDir(fileDirPath, {mode: '0760'}, function () {
            const filename = getFileNameFromPath(url);
            const filepath = path.join(fileDirPath, filename);

            if (url.indexOf('data') === 0) {
                const imageData = url.split(';base64,').pop();

                fs.writeFile(filepath, imageData, {encoding: 'base64'}, function (err) {
                    if (err) {
                        fs.unlink(filepath);

                        return reject(err);
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
                    fs.unlink(filepath);

                    return reject(err);
                });
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
    let params = {creator: 'citizenos.com'};
    if (title) {
        params.title = title;
    }
    _addStyles(params);
    const finalDoc = new Document(params);

    const _isHeadingElement = function (element) {
        if (element.name) {
            return element.name.match(/h+[0-6]/gi);
        }

        return false;
    };

    const _isCodeElement = function (element) {
        return element.type === 'tag' && element.name && element.name === 'code';
    };

    const _isAlignmentElement = function (element) {
        console.log(element.type, element.name);
        if (element.name) {
            return style.align.indexOf(element.name) > -1;
        }

        return false;
    };

    const _isColorElement = function (element) {
        if (element.attribs && element.attribs.class) {
            return /color:[a-z]*/gi.test(element.attribs.class);
        }

        return false;
    };

    const _isListElement = function (element) {
        return element.type === 'tag' && element.name && (element.name === 'ul' || element.name === 'ol' || element.name === 'li');
    };

    const _isBrElement = function (element) {
        return element.type === 'tag' && element.name && element.name === 'br';
    };

    const _isBoldElement = function (element) {
        return element.type === 'tag' && element.name && element.name === 'strong';
    };

    const _isItalicElement = function (element) {
        return element.type === 'tag' && element.name && element.name === 'em';
    };

    const _isUnderlineElement = function (element) {
        return element.type === 'tag' && element.name && element.name === 'u';
    };

    const _isStrikeElement = function (element) {
        return element.type === 'tag' && element.name && element.name === 's';
    };

    const _isImgElement = function (element) {
        return element.type === 'tag' && element.name && element.name === 'img';
    };

    const _isParagraphElement = function (element) {
        if (element.type !== 'text') {
            if (_isHeadingElement(element)) {
                return true;
            } else if (_isCodeElement(element)) {
                return true;
            } else if (_isImgElement(element)) {
                return true;
            } else if (_isAlignmentElement(element)) {
                return true;
            } else if (_isBrElement(element)) {
                return true;
            } else if (element.name === 'li') {
                return true;
            }
        }

        return false;
    };

    const _isIndentListElement = function (element) {
        const item = findItemByClass(element, 'indent');

        if (item) {
            return true;
        }

        return false;
    };

    const _isBulletListElement = function (element) {
        return element.name && element.name === 'ul' && element.attribs && element.attribs.class === 'bullet';
    };

    const _isFontSizeElement = function (element) {
        return element.attribs && element.attribs.class && element.attribs.class.match(/font-size/g);
    };

    const _isTextElement = function (element) {
        if (element.type === 'text') {
            return true;
        } else if (_isStrikeElement(element) ||
            _isUnderlineElement(element) ||
            _isItalicElement(element) ||
            _isBoldElement(element) ||
            (_isColorElement(element) || _isFontSizeElement(element))) {
            return true;
        }

        return false;
    };

    const _getParagraphStyle = function (item, attributes) {
        let depth = null;
        if (!attributes) {
            attributes = {};
        }

        if (item.name && _isHeadingElement(item)) {
            attributes.heading = HeadingLevel['HEADING_'+item.name.replace('h','')]
        }

        if (item.name && _isCodeElement(item)) {
            attributes.style = 'code';
        }

       /*if (item.name && _isImgElement(item)) {
            attributes.push({'img': item.attribs.src});
        }*/

        if (_isAlignmentElement(item)) {
            console.log(item.name.toUpperCase())
            attributes.alignment = AlignmentType[item.name.toUpperCase()]
        }
        if (_isBulletListElement(item)) {
            depth = _getItemDepth(item, null, true);
            if (!attributes.bullet)
                attributes.bullet = {level: depth};
        } else if (item.name && item.name === 'ol') {
            depth = _getItemDepth(item, null, true);
            if (!attributes.numbering)
                attributes.numbering = {reference: "numberLi", level: depth};
        } else if (_isIndentListElement(item)) {
            depth = _getItemDepth(item, null, true);
            if (!attributes.bullet)
                attributes.indent = {level: depth};
        }

        if (item.parent && item.parent.name !== 'body') {
            return _getParagraphStyle(item.parent, attributes);
        }

        return attributes;
    };

    const _getElementFontSizeFromStyle = function (element) {
        let size = element.attribs.class.match(/(?:font-size:)([0-9]*)?/i);
        if (size[1]) {
            size = (Math.round(size[1] * 0.75 * 2) / 2).toFixed(1); // pixels to pts

            return size * 2; // pts to half pts
        }
    };
    const _getItemDepth = function (item, depth, isList) {
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

    const _getTextWithFormat = function (item, children, attributes) {
        if (!attributes) {
            attributes = {};
        }

        if (_isColorElement(item)) {
            const colorName = item.attribs.class.split('color:')[1];
            attributes.color = style.colors[colorName];
        } else if (_isBoldElement(item)) {
            attributes.bold = true;
        } else if (_isItalicElement(item)) {
            attributes.italics = true;
        } else if (_isUnderlineElement(item)) {
            attributes.underline = {};
        } else if (_isStrikeElement(item)) {
            attributes.strike = {};
        } else if (_isFontSizeElement(item)) {
            attributes.size = _getElementFontSizeFromStyle(item);
        }

        if (item.type === 'text') {
            const textNode = attributes;
            textNode.text = encoder.decode(item.data);
            children.push( new TextRun (textNode));

            return true;
        } else if (item.children) {
            item.children.forEach(function (gc) {
                if (!_isListElement(gc)) {
                    const itemAttributes = attributes;
                    const value = _getTextWithFormat(gc, children, itemAttributes);
                    if (value && typeof value === 'object') {
                        children.push(value);

                        return true;
                    }
                }
            });
        }
    };

    const _childTagToFormat = function (child, properties, isList) {

        _getParagraphStyle(child, properties);
        if (child.children) {
            child.children.forEach(function (gchild) {
                _getParagraphStyle(gchild, properties);
                _getTextWithFormat(gchild, properties.children, null, isList);
            });
        }

        return properties;

    };

    const _listItems = function (element, items) {
        items = items || [];
        if (element.children) {
            element.children.forEach(function (child) {
                let lastItem = null;
                if (_isTextElement(child) && element.name === 'li') {
                    lastItem = items[items.length - 1];
                    if (!_.isEqual(element, lastItem)) {
                        items.push(element);
                    }

                    return items;
                } else if (_isHeadingElement(child) && element.name === 'li') {
                    lastItem = items[items.length - 1];
                    if (!_.isEqual(child, lastItem)) {
                        items.push(child);
                    }

                    return items;
                }

                return _listItems(child, items);
            });
        }

        return items;
    };

    const _listElementHandler = function (element) {

        if (_isIndentListElement(element) || _isBulletListElement(element) || element.name === 'ol') {
            const liItems = _listItems(element);
            liItems.forEach(function (li) {
                const children = [];
                _getTextWithFormat(li, children);
                let paragrpahProperties = {};
                paragrpahProperties = _getParagraphStyle(li, paragrpahProperties);
                paragrpahProperties.children = children

                finalParagraphs.push(new Paragraph(paragrpahProperties));
            });
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
            body.children.forEach(function (tag) {
                if (_isListElement(tag)) {
                    _listElementHandler(tag);
                }
                else if (_isParagraphElement(tag)) {
                    const paragraphProperties = _childTagToFormat(tag, {
                        children: []
                    });
                    if (Object.keys(paragraphProperties).length)
                        finalParagraphs.push(new Paragraph(paragraphProperties))
                }
                else if (_isTextElement(tag)) {
                    const textElement = {
                        children: []
                    }
                    _getTextWithFormat(tag, textElement.children);
                    finalParagraphs.push(new Paragraph(textElement));
                }
            });
        }
    }

    const downloadDocImages = async function (paragraphs) {
        const imageDownloadPromises = [];

        return new Promise(function (resolve) {
            let counter = 0;
            paragraphs.forEach(function (row) {
                row.paragraph.forEach(function (method) {
                    if (method && typeof method === 'object') {
                        const key = Object.keys(method);
                        if (key[0] === 'img') {
                            imageDownloadPromises.push(getImageFile(method.img, resPath));
                        }
                    }
                });
                counter++;
            });
            if (counter >= paragraphs.length) {
                return Promise
                    .all(imageDownloadPromises)
                    .then(function () {
                        return resolve();
                    });
            }
        });
    };

    const scaleImage = function (path) {
        const dimensions = sizeOf(path);
        if (dimensions.width > 605) {
            return Math.round((605 / dimensions.width) * 100) / 100;
        }

        return 1;
    };

    /**
     * Return docx from input html
     *
     * @param {text} [html] text
     *
     * @returns {Promise}
     *
     * @public
     */

    this.processHTML = async function (html, res) {
        const processHtml = this.html || html;
        const path = this.path;

        return new Promise(function (resolve, reject) {
            const handler =  new htmlparser.DefaultHandler(async function (err, result) {
                if (err) {
                    return reject(err);
                }
                await _handleParserResult(result);
                finalDoc.addSection({children: finalParagraphs});
           //     const finalDoc = await createFinalDoc(paragraphs);

                const b64string = await Packer.toBase64String(finalDoc);
                await fs.writeFileSync('./TEST.docx', Buffer.from(b64string, 'base64'));
                resolve();
            });
            const parser = new htmlparser.Parser(handler);
            parser.parseComplete(processHtml);
        });
    };
}


module.exports = CosHtmlToDocx;
