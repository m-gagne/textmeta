'use strict';

var fs = require('fs');
require('pdfjs-dist');
var objectAssign = require('object-assign');

// adding DOMParser to read XMP metadata.
// from: https://github.com/mozilla/pdf.js/blob/master/examples/node/getinfo.js
global.DOMParser = require('./domparsermock.js').DOMParserMock;

var PDFTextExtractor = function (options) {
  this.options = objectAssign({}, {
    numericPrecision: 0,
    nonWhitespaceRegexp: "/\\S/",
    replaceMultipleSpaces: true,
    orderByYPos: false,
    distanceToAddSpace: 1
  }, options);

  if (typeof this.options.nonWhitespaceRegexp === "string") {
    this.options.nonWhitespaceRegexp = new RegExp(this.options.nonWhitespaceRegexp);
  }

}

PDFTextExtractor.prototype = {
  getDataFromFile: function(file) {
    if (!fs.existsSync(file)) {
      console.log("Error, could not open file: " + file);
      return;
    }

    return this.getDataFromBuffer(new Uint8Array(fs.readFileSync(file)));
  },
  applyTransform: function (p, m) {
    // Source: https://github.com/mozilla/pdf.js/blob/master/src/shared/util.js
    var xt = p[0] * m[0] + p[1] * m[2] + m[4];
    var yt = p[0] * m[1] + p[1] * m[3] + m[5];
    return [xt, yt];
  },
  isAllWhitespace: function (str) {
    return !this.options.nonWhitespaceRegexp.test(str);
  },
  prepareString: function(str) {
    if (this.options.replaceMultipleSpaces) {
      str = str.replace(/\s\s+/, ' ');
    }

    return str;
  },
  applyPrecision: function(number) {
    return number.toFixed(this.options.numericPrecision);
  },
  getDataFromBuffer: function(data) {
    var extract = function(resolve, reject) {
      var document = PDFJS.getDocument(data).then((document) => {
        var lastPromise, documentInfo, lastItem, pageView, lastTransform, currentTransform, isAllWhitespace;
        var documentText = "";
        var pageText = "";
        var lines = [];

        lastPromise = document.getMetadata().then((data) => {
          documentInfo = data;
        });

        var loadPage = (pageNumber) => {
          return document.getPage(pageNumber).then((page) => {
            pageView = page.pageInfo.view;
            lastItem = null;
            return page.getTextContent().then((content) => {
              lines = [];
              pageText = "";

              content.items.map((item) => {
                item.appliedTransform = this.applyTransform(pageView, item.transform);
                item.str = this.prepareString(item.str);
                item.isAllWhitespace = this.isAllWhitespace(item.str);

                if (pageText !== "") {
                  if (lastItem && this.applyPrecision(item.appliedTransform[1]) != this.applyPrecision(lastItem.appliedTransform[1])) {
                    if (this.options.orderByYPos) {
                      lines.push({
                        text: pageText,
                        y: item.appliedTransform[1]
                      });

                      pageText = "";
                    }
                    else {
                      pageText += "\n";
                    }
                  } else if (!item.isAllWhitespace && lastItem && !lastItem.isAllWhitespace &&
                    this.applyPrecision(item.appliedTransform[0]) - this.applyPrecision(lastItem.appliedTransform[0] + lastItem.width) > this.options.distanceToAddSpace
                  ){
                    pageText += " ";
                  }
                }

                if (!isAllWhitespace) {
                  pageText += item.str;
                }
                lastItem = item;
              });

              if (this.options.orderByYPos) {
                if (pageText != "") {
                  lines.push({
                    text: pageText,
                    y: lastItem.appliedTransform[1]
                  });
                }

                lines.sort((a, b) => {
                  // in PDFs X,Y start at bottom right, to the larger the Y the closer to the top of the page
                  return b.y - a.y
                });

                documentText += lines.map((line) => { return line.text}).join('\n');
              } else {
                documentText += pageText;
              }
            });
          });
        }

        var pages = document.numPages;
        for (var i = 1; i <= pages; i++) {
          lastPromise = lastPromise.then(loadPage.bind(this, i));
        }

        lastPromise.then(() => {
          resolve({
            info: documentInfo,
            text: documentText
          });
        })
      });
    };

    return new Promise(extract.bind(this));
  }
}

module.exports = PDFTextExtractor;