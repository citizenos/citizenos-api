'use strict';

/**
 * Convert HTML to docx
 */

var officeClippy = require('office-clippy');

// Used to create docx files
var docx = officeClippy.docx;
var htmlparser = require('htmlparser2');
var Promise = require('bluebird');
var encoder = require('html-entities').AllHtmlEntities;
var fs = require('fs');

var headingStyleMethods = {
    heading1: [
        {'size': 69}, //px to half-pts
        'bold'
    ],
    heading2: [
        {'size': 60},
        'bold'
    ],
    heading3: [
        {'size': 51},
        'bold'
    ],
    heading4: [
        {'size': 42},
        'bold'
    ],
    heading5: [
        {'size': 33},
        'bold'
    ],
    heading6: [
        {'size': 24},
        'bold'
    ]
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
    var finalDoc = docx.create(params);

    var _isHeadingElement = function (element) {
        if (element.name) {
            return element.name.match(/h+[0-6]/gi);
        }

        return false;
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

    var _isParagraphElement = function (element) {
        if (element.type !== 'text') {
            if (_isHeadingElement(element)) {
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

        if (_isAlignmentElement(item)) {
            attributes.push(item.attribs.class);
        }
        if (_isBulletListElement(item)) {
            attributes.paragraph.push('bullet');
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
                style: attributes
            });

            return true;
        } else if (item.children) {
            item.children.forEach(function (gc) {
                var itemAttributes = attributes.slice(0);
                var value = _getTextWithFormat(gc, texts, itemAttributes);
                if (value) {
                    texts.push(value);

                    return true;
                }
            });
        }
    };

    var _childTagToFormat = function (child, properties) {

        _getParagraphStyle(child, properties.paragraph);
        if (child.children) {
            child.children.forEach(function (gchild) {
                _getParagraphStyle(gchild, properties.paragraph);
                _getTextWithFormat(gchild, properties.texts);
            });
        }

        return properties;

    };


    var _listParser = function (items, paragraphs, styles, depth) {
        var paragraphElement = null;
        depth = depth || 0;

        styles.forEach(function (style, k) {
            if ((style === 'bullet' || style === 'indent' || style === 'numberLi') && depth > 0) {
                var styleObject = {};
                styleObject[style] = depth;
                styles[k] = styleObject;
            }

            if (typeof style === 'object') {
                var keys = Object.keys(style);
                if (keys[0] === 'bullet' || keys[0] === 'indent' || keys[0] === 'numberLi') {
                    style[keys[0]] = depth;
                }
            }
        });
        items.forEach(function (tag) {
            var itemStyle = styles.slice(0);
            if (_isListElement(tag) && tag.name !== 'li') {
                if (_isIndentListElement(tag)) {
                    itemStyle.push({'indent': depth});
                } else if (_isBulletListElement(tag)) {
                    itemStyle.push({'bullet': depth});
                } else if (tag.name === 'ol') {
                    itemStyle.push({'numberLi': depth});
                }
                depth++;
                _listParser(tag.children, paragraphs, itemStyle, depth);
            } else if (_isParagraphElement(tag)) {
                if (paragraphElement) {
                    paragraphs.push(paragraphElement);
                }

                paragraphElement = {
                    paragraph: itemStyle,
                    texts: []
                };

                var paragraphProperties = _childTagToFormat(tag, paragraphElement);
                if (paragraphProperties) {
                    var parClone = JSON.parse(JSON.stringify(paragraphElement));
                    paragraphs.push(parClone);
                    paragraphElement = null;
                }

            } else if (_isTextElement(tag)) {
                if (!paragraphElement) {
                    paragraphElement = {
                        paragraph: itemStyle,
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

            } else {
                depth++;
                _listParser(tag.children, paragraphs, itemStyle, depth);
            }
        });
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

                    if (_isParagraphElement(tag)) {
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

    /**
     * Iterates through all paragraphs and texts to return final structure and formatting of the document
     *
     * @param {array} paragraph objects with formatting values
     *
     * @returns {Promise}
     * @private
     */

    var createFinalDoc = function (paragraphs) {
        return new Promise(function (resolve) {
            if (!paragraphs || !paragraphs.length) {
                return resolve();
            }

            var parCount = 0;

            paragraphs.forEach(function (row) {
                parCount++;
                var isHeading = false; // to create heading style according to CitizenOS etherpad styles
                var headingMethod = null;
                var paragraph = docx.createParagraph();

                row.paragraph.forEach(function (method) {
                    if (method && typeof method === 'object') {
                        var key = Object.keys(method);
                        paragraph[key[0]](method[key[0]]);
                    }

                    if (paragraph[method]) {
                        paragraph[method]();
                    }

                    if (method && typeof method === 'string' && method.search('heading') > -1) {
                        isHeading = true;
                        headingMethod = method;
                    }
                });

                row.texts.forEach(function (text) {
                    if (text.text) {
                        var textObject = docx.createText(encoder.decode(text.text.replace(/ /g, '\xa0'))); // otherwise spaces  will get trimmed
                        text.style.forEach(function (style) {
                            if (style && typeof style === 'object') {
                                var key = Object.keys(style);
                                textObject[key[0]](style[key[0]]);
                            }

                            if (textObject[style]) {
                                textObject[style]();
                            }
                        });
                        if (isHeading) {
                            var headingStyle = headingStyleMethods[headingMethod];
                            headingStyle.forEach(function (style) {
                                if (style && typeof style === 'object') {
                                    var key = Object.keys(style);
                                    textObject[key[0]](style[key[0]]);
                                }

                                if (textObject[style]) {
                                    textObject[style]();
                                }
                            });
                        }
                        paragraph.addText(textObject);
                    }
                });

                finalDoc.addParagraph(paragraph);

                if (parCount === paragraphs.length) {
                    return resolve();
                }
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

    this.processHTML = function (html) {
        var processHtml = this.html || html;
        var path = this.path;

        return new Promise(function (resolve, reject) {
            var handler = new htmlparser.DefaultHandler(function (err, res) {
                if (err) {
                    return reject(err);
                }

                _handleParserResult(res)
                    .then(function (paragraphs) {
                        createFinalDoc(paragraphs)
                            .then(function () {
                                var output = fs.createWriteStream(path);
                                var exporter = officeClippy.exporter;

                                exporter.local(output, finalDoc).then(function () {
                                    return resolve();
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
