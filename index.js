// Marc Gagne
//
//    Licensed under the Apache License, Version 2.0 (the "License");
//    you may not use this file except in compliance with the License.
//    You may obtain a copy of the License at
//
//        http://www.apache.org/licenses/LICENSE-2.0
//
//    Unless required by applicable law or agreed to in writing, software
//    distributed under the License is distributed on an "AS IS" BASIS,
//    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//    See the License for the specific language governing permissions and
//    limitations under the License.

'use strict';

const PDFTextExtractor = require('./lib/pdftextextractor.js');
const RXProcessor = require('./lib/rxprocessor.js');

function extractFromPDFFile(file, rules, options) {
  return new Promise((resolve, reject) =>{
    var pdfExtractor = new PDFTextExtractor(options);
    pdfExtractor.getDataFromFile(file).then((data) => {
      let meta = processText(data.text, rules);
      resolve({
        text: data.text,
        meta: meta
      });
    });
  });
}

function extractFromPDFBuffer(buffer, rules, options) {
  return new Promise((resolve, reject) => {
    var pdfExtractor = new PDFTextExtractor(options);
    pdfExtractor.getDataFromBuffer(buffer).then((data) => {
      let meta = processText(data.text, rules);
      resolve({
        text: data.text,
        meta: meta
      });
    });
  });
}

function processText(text, rules, options) {
  var rxProcessor = new RXProcessor();
  return rxProcessor.process(text, rules, options);
}

exports.extractFromPDFFile = extractFromPDFFile;
exports.extractFromPDFBuffer = extractFromPDFBuffer;
exports.processText = processText;