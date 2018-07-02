'use strict';

/**
 * Convert HTML to docx
 */

var docx = require('docx');

// Used to create docx files
var htmlparser = require('htmlparser2');
var Promise = require('bluebird');
var encoder = require('html-entities').AllHtmlEntities;
var fs = require('fs');
var fsExtra = require('fs-extra');
var https = require('https');
var path = require('path');
var sizeOf = require('image-size');
var _ = require('lodash');

var _addStyles = function (doc) {
    doc.Styles.createParagraphStyle('code', 'code')
        .basedOn('Normal')
        .next('Normal')
        .font('Courier New')
        .size(24);
};

var style = {
    a: {
        color: '0680FC'
    },
    b: {
        bold: true
    },
    u: {
        underline: true
    },
    i: {
        italic: true
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

var findItemByProperty = function (items, text, property) {
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

var getFilesPath = function (pathIn) {
    var pathOut = pathIn || 'files';
    if (path.basename(pathOut).indexOf('.') > -1) {
        pathOut = pathOut.replace(path.basename(pathOut), '');
    }

    return pathOut;
};

var getImageFile = function (url, dirpath) {
    var fileDirPath = getFilesPath(dirpath);

    // Base64 quickfix
    if (url.indexOf('data:') === 0) {
        return Promise.resolve();
    }

    return new Promise(function (resolve, reject) {
        fsExtra.ensureDir(fileDirPath, {mode: '0760'}, function () {
            var filename = url.split('/').pop().split('#')[0].split('?')[0];
            var filepath = path.join(fileDirPath, filename);
            var file = fs.createWriteStream(filepath);

            https
                .get(url, function (response) {
                    response.pipe(file);
                    file.on('finish', function () {
                        file.close();

                        return resolve(filepath);
                    });
                })
                .on('error', function (err) { // Handle errors
                    fs.unlink(filepath);

                    return reject(err);
                });
        });
    });
};

var findItemByClass = function (item, className) {
    if (!item) {
        return;
    }
    if (item.attribs && item.attribs.class === className) {
        return item;
    }
    if (item.children) {
        for (var i = 0; i < item.children.length; i++) {
            var citem = item.children[i];
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

    var params = {creator: 'citizenos.com'};
    if (title) {
        params.title = title;
    }
    var finalDoc = new docx.Document(params);
    _addStyles(finalDoc);
    var _isHeadingElement = function (element) {
        if (element.name) {
            return element.name.match(/h+[0-6]/gi);
        }

        return false;
    };

    var _isCodeElement = function (element) {
        return element.type === 'tag' && element.name && element.name === 'code';
    };

    var _isAlignmentElement = function (element) {
        if (element.attribs && element.attribs.class) {
            return style.align.indexOf(element.attribs.class) > -1;
        }

        return false;
    };

    var _isColorElement = function (element) {
        if (element.attribs && element.attribs.class) {

            return Object.keys(style.colors).indexOf(element.attribs.class) > -1;
        }

        return false;
    };

    var _isListElement = function (element) {
        return element.type === 'tag' && element.name && (element.name === 'ul' || element.name === 'ol' || element.name === 'li');
    };

    var _isBrElement = function (element) {
        return element.type === 'tag' && element.name && element.name === 'br';
    };

    var _isBoldElement = function (element) {
        return element.type === 'tag' && element.name && element.name === 'strong';
    };

    var _isItalicElement = function (element) {
        return element.type === 'tag' && element.name && element.name === 'em';
    };

    var _isUnderlineElement = function (element) {
        return element.type === 'tag' && element.name && element.name === 'u';
    };

    var _isStrikeElement = function (element) {
        return element.type === 'tag' && element.name && element.name === 's';
    };

    var _isImgElement = function (element) {
        return element.type === 'tag' && element.name && element.name === 'img';
    };

    var _isParagraphElement = function (element) {
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

    var _isIndentListElement = function (element) {
        var item = findItemByClass(element, 'indent');

        if (item) {
            return true;
        }

        return false;
    };

    var _isBulletListElement = function (element) {
        return element.name && element.name === 'ul' && element.attribs && element.attribs.class === 'bullet';
    };

    var _isFontSizeElement = function (element) {
        return element.attribs && element.attribs.style && element.attribs.style && element.attribs.style.match(/font-size/g);
    };

    var _isTextElement = function (element) {
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

    var _getParagraphStyle = function (item, attributes) {
        if (!attributes) {
            attributes = [];
        }

        if (item.name && _isHeadingElement(item)) {
            attributes.push('heading' + item.name[1]);
        }

        if (item.name && _isCodeElement(item)) {
            attributes.push('code');
        }

        if (item.name && _isImgElement(item)) {
            attributes.push({'img': item.attribs.src});
        }

        if (_isAlignmentElement(item)) {
            attributes.push(item.attribs.class);
        }
        if (_isBulletListElement(item)) {
            attributes.push('bullet');
        } else if (item.name && item.name === 'ul') {
            attributes.push('numberLi');
        }

        return attributes;
    };

    var _getElementFontSizeFromStyle = function (element) {
        var size = element.attribs.style.match(/(?:font-size:)([0-9]*)?(?:px)/i);
        if (size[1]) {
            size = (Math.round(size[1] * 0.75 * 2) / 2).toFixed(1); // pixels to pts

            return size * 2; // pts to half pts
        }
    };
    var _getItemDepth = function (item, depth, isList) {
        depth = depth || 0;
        if (item.parent && item.parent.name !== 'body') {
            if (!isList || (isList === true && _isListElement(item.parent) && item.parent.name !== 'li')) {
                depth++;
            }

            return _getItemDepth(item.parent, depth, isList);
        } else if (isList) {
            return depth - 1;
        }

        return depth;
    };

    var _getTextWithFormat = function (item, texts, attributes) {
        if (!attributes) {
            attributes = [];
        }

        if (_isColorElement(item)) {
            attributes.push({color: item.attribs.class});
        } else if (_isBoldElement(item)) {
            attributes.push('bold');
        } else if (_isItalicElement(item)) {
            attributes.push('italic');
        } else if (_isUnderlineElement(item)) {
            attributes.push('underline');
        } else if (_isStrikeElement(item)) {
            attributes.push('strike');
        } else if (_isFontSizeElement(item)) {
            var fontSize = _getElementFontSizeFromStyle(item);
            attributes.push({'size': fontSize});
        }

        if (item.type === 'text') {
            texts.push({
                text: item.data,
                style: attributes,
                item: item
            });

            return true;
        } else if (item.children) {
            item.children.forEach(function (gc) {
                if (!_isListElement(gc)) {
                    var itemAttributes = attributes.slice(0);
                    var value = _getTextWithFormat(gc, texts, itemAttributes);
                    if (value && typeof value === 'object') {
                        texts.push(value);

                        return true;
                    }
                }
            });
        }
    };

    var _childTagToFormat = function (child, properties, isList) {

        _getParagraphStyle(child, properties.paragraph);
        if (child.children) {
            child.children.forEach(function (gchild) {
                _getParagraphStyle(gchild, properties.paragraph);
                _getTextWithFormat(gchild, properties.texts, null, isList);
            });
        }

        return properties;

    };

    var _getListItemProperties = function (item, properties) {
        properties = properties || [];
        if (item.name && _isHeadingElement(item)) {
            properties.push('heading' + item.name[1]);
        }

        if (item.name && _isCodeElement(item)) {
            properties.push('code');
        }
        if (_isAlignmentElement(item)) {
            properties.push(item.attribs.class);
        }
        if (_isBulletListElement(item)) {
            properties.push('bullet');
        } else if (item.name && item.name === 'ol') {
            properties.push('numberLi');
        } else if (_isIndentListElement(item)) {
            properties.push('indent');
        }
        if (item.parent && item.parent.name !== 'body') {
            return _getListItemProperties(item.parent, properties);
        }

        return properties;
    };

    var _listItems = function (element, items) {
        items = items || [];
        if (element.children) {
            element.children.forEach(function (child) {
                var lastItem = null;
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

    var _listElementHandler = function (element, paragraphs) {

        if (_isIndentListElement(element) || _isBulletListElement(element) || element.name === 'ol') {
            var liItems = _listItems(element);
            liItems.forEach(function (li) {
                var texts = [];
                _getTextWithFormat(li, texts);
                var paragrpahProperties = [];
                var d = _getItemDepth(texts[0].item, null, true);
                _getListItemProperties(li, paragrpahProperties);
                paragrpahProperties = _.uniq(paragrpahProperties, function (v) {
                    return v;
                });
                var paragraphElement = {
                    paragraph: [],
                    texts: texts
                };

                paragrpahProperties.forEach(function (prop) {
                    if (prop === 'bullet' || prop === 'indent' || prop === 'numberLi') { //Add level to list item
                        var propObj = {};
                        propObj[prop] = d;
                        paragraphElement.paragraph.push(propObj);
                    } else {
                        paragraphElement.paragraph.push(prop);
                    }
                });
                paragraphElement.paragraph.reverse();
                paragraphs.push(paragraphElement);
            });
        }
    };

    /**
     * Iterates through parsed html objects
     *
     * @param {array} result Parsed html objects array
     *
     * @returns {Promise<Array>} Paragraph elements
     *
     * @private
     */
    var _handleParserResult = function (result) {
        return new Promise(function (resolve) {
            var body = findItemByProperty(result, 'body'); // All the content of the document is inside body
            if (body && body.children) {
                var paragraphs = [];
                var i = 0;
                var paragraphElement = null;
                var brCounter = 0; // to check how many linebreaks are in a row

                body.children.forEach(function (tag) {
                    i++;
                    if (_isListElement(tag)) {
                        _listElementHandler(tag, paragraphs);
                    } else if (_isParagraphElement(tag)) {
                        if (_isBrElement(tag)) {
                            brCounter++;
                        }
                        if (paragraphElement) {
                            paragraphs.push(paragraphElement);
                            paragraphElement = null;
                        }
                        //single break is always used after each document line from etherpad 
                        //if there are more <br> tags create new empty line 
                        if (brCounter > 1 || !_isBrElement(tag)) {
                            paragraphElement = {
                                paragraph: [],
                                texts: []
                            };
                            var paragraphProperties = _childTagToFormat(tag, paragraphElement);
                            if (paragraphProperties) {
                                if (_isBrElement(tag)) {
                                    paragraphElement.texts.push('');
                                }
                                paragraphs.push(paragraphElement);
                                paragraphElement = null;
                            }
                            if (!_isBrElement(tag)) {
                                brCounter = 0;
                            }
                        }
                    } else if (_isTextElement(tag)) {
                        brCounter = 0;
                        if (!paragraphElement) {
                            paragraphElement = {
                                paragraph: [],
                                texts: []
                            };
                        }
                        if (tag.type === 'text') {
                            paragraphElement.texts.push({
                                text: tag.data,
                                style: []
                            });
                        } else {
                            _getTextWithFormat(tag, paragraphElement.texts);
                        }

                    }

                    if (i === body.children.length) {
                        if (paragraphElement) {
                            paragraphs.push(paragraphElement);
                            paragraphElement = null;
                        }
                        resolve(paragraphs);
                    }
                });

            } else {
                return resolve();
            }
        });
    };

    var downloadDocImages = function (paragraphs) {
        var imageDownloadPromises = [];

        return new Promise(function (resolve) {
            var counter = 0;
            paragraphs.forEach(function (row) {
                row.paragraph.forEach(function (method) {
                    if (method && typeof method === 'object') {
                        var key = Object.keys(method);
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

    var scaleImage = function (path) {
        var dimensions = sizeOf(path);
        if (dimensions.width > 605) {
            return Math.round((605 / dimensions.width) * 100) / 100;
        }

        return 1;
    };

    /**
     * Iterates through all paragraphs and texts to return final structure and formatting of the document
     *
     * @param {array} paragraphs objects with formatting values
     *
     * @returns {Promise} Promise
     * @private
     */
    var createFinalDoc = function (paragraphs) {
        return new Promise(function (resolve) {
            if (!paragraphs || !paragraphs.length) {
                return resolve();
            }
            downloadDocImages(paragraphs)
                .then(function () {

                    var parCount = 0;
                    paragraphs.forEach(function (row) {
                        parCount++;
                        var paragraph = new docx.Paragraph();
                        var addImageInProgress = false;
                        row.paragraph.forEach(function (method) {

                            if (method && typeof method === 'object') {
                                var key = Object.keys(method);
                                if (key[0] === 'img') {

                                    var filename = method.img.split('/').pop().split('#')[0].split('?')[0];
                                    var filesDirPath = getFilesPath(resPath);
                                    var filePath = path.join(filesDirPath, filename);
                                    var image1 = finalDoc.createImage(filePath);
                                    var scale = scaleImage(filePath);
                                    image1.scale(scale);
                                } else if (key[0] === 'numberLi') {
                                    var numbering = new docx.Numbering();
                                    var numberedAbstract = numbering.createAbstractNumbering();
                                    numberedAbstract.createLevel(0, 'decimal', '%1)', 'left');
                                    numberedAbstract.createLevel(1, 'decimal', '%2)', 'left');
                                    numberedAbstract.createLevel(2, 'decimal', '%3)', 'left');
                                    numberedAbstract.createLevel(3, 'decimal', '%4).', 'left');

                                    var concrete = numbering.createConcreteNumbering(numberedAbstract);
                                    paragraph.setNumbering(concrete, method[key[0]]);
                                } else if (key[0] === 'indent') {
                                    var multiplier = method[key[0]];
                                    var start = 720 * (multiplier + 1);
                                    paragraph.indent({
                                        left: start,
                                        hanging: multiplier
                                    });
                                } else if (paragraph[key[0]]) {
                                    paragraph[key[0]](method[key[0]]);
                                }
                            } else if (paragraph[method]) {
                                paragraph[method]();
                            } else if (['code'].indexOf(method) > -1) {
                                paragraph.style(method);
                            }
                        });

                        row.texts.forEach(function (text) {
                            if (text.text) {
                                var textObject = new docx.TextRun(encoder.decode(text.text.replace(/ /g, '\xa0'))); // otherwise spaces  will get trimmed
                                text.style.forEach(function (textStyle) {
                                    if (textStyle && typeof textStyle === 'object') {
                                        var key = Object.keys(textStyle);
                                        if (key[0] === 'color') {
                                            textObject.color(style.colors[textStyle[key[0]]]);
                                        } else {
                                            textObject[key[0]](textStyle[key[0]]);
                                        }
                                    } else if (textObject[textStyle]) {
                                        if (textStyle === 'underline') {
                                            textObject.underline('single', null);
                                        } else {
                                            textObject[textStyle]();
                                        }
                                    }
                                });
                                paragraph.addRun(textObject);
                            }
                        });

                        finalDoc.addParagraph(paragraph);

                        if (parCount === paragraphs.length && !addImageInProgress) {
                            return resolve();
                        }
                    });
                });
        });

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

    this.processHTML = function (html, res) {
        var processHtml = this.html || html;
        var path = this.path;

        return new Promise(function (resolve, reject) {
            var handler = new htmlparser.DefaultHandler(function (err, result) {
                if (err) {
                    return reject(err);
                }

                _handleParserResult(result)
                    .then(function (paragraphs) {
                        createFinalDoc(paragraphs)
                            .then(function () {
                                var exporter = null;
                                if (res) {
                                    exporter = new docx.ExpressPacker(finalDoc, res);

                                    return exporter.pack('Mydocx');
                                }
                                exporter = new docx.LocalPacker(finalDoc);
                                exporter.pack(path)
                                    .then(function () {
                                        return resolve();
                                    })
                                    .catch(function (err) {
                                        return reject(err);
                                    });
                            });
                    });
            });
            var parser = new htmlparser.Parser(handler);
            parser.parseComplete(processHtml);
        });
    };
}


module.exports = CosHtmlToDocx;
