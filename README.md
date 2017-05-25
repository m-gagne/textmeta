# TextMeta

TextMeta allows for processing of PDF files, it extracts the text & metadata using rules (Regular Expressions) which is then returned in the format `{ "text": "extracted_text", meta: {}}`.

## Installation

    npm install textmeta

## Usage

    var textmeta = require('textmeta');

    var rules = [
      {
        key: "Author",
        type: "FirstSingle",
        expression: "Author:\\s+([^\\n]+)",
        default: "Unknown"
      }
    ];

    textmeta.extractFromPDFFile("samples/sample_doc.pdf", rules).then((result) => {
      console.log("Text => " + result.text);
      console.log("Metadata => " + JSON.stringify(result.meta, null, 4));
    });


For an example of the rules see the [rules.json](https://github.com/m-gagne/PDF2AzSearch/blob/master/functions/pdfmetafunc/rules.json) file from a sample Azure Function that uses this module.

## API

### extractFromPDFFile(file, rules)

Extracts text from the source PDF `file` and metadata using the supplied `rules`. Returns `{ text: "...", meta: {} }`.

### extractFromPDFBuffer(buffer, rules)

Extracts text from the supplied `buffer` and metadata using the supplied `rules`. Returns `{ text: "...", meta: {} }`.

### processText(file, rules)

Returns metadata using the supplied `text`.

## Rules

The format for a rule is

    {
      "key": "<Metadata Name>",
      "type": "<Match Type>",
      "expression": "<Regular Expression>",
      "default": "<Default Value if no matches>"
      "startKeyword": "Optional: <Keyword for substring match start>",
      "endKeyword": "Optional: <Keyword for substring match end>",
      "options": {
        "flags": "<Optional RegularExpression Flags>"
      }
    }

### Rule Types:

* "FirstSingle" : Will capture the first match.
* "All" : Will capture all matches.
* "AllUnique" : Will capture all matches and return the list of unique strings.

### Start/End Keywords

If you want to run your expression on a subset of the text, then specify the start/end keywords and only the text in between will be used.

### Sample PDF

The result of processing the sample file [sample_doc.pdf](https://github.com/m-gagne/PDF2AzSearch/blob/master/sample/sample_doc.pdf) using the sample [rules.json](https://github.com/m-gagne/PDF2AzSearch/blob/master/functions/pdfmetafunc/rules.json) is the following result:

        {
          "id": "dafe8948ef379e6aef78cc1b059122cebcae436d7dd878375f16094a99a9243b",
          "name": "sample_doc.pdf",
          "text": "Title: PDF to Text Function \nAuthor: Marc Gagne \n \nDescription:  \nAn azure function that extracts text from PDFs, runs the regular expression captures found in rules.json \nagainst the text and stores the results in DocumentDB. \n \nTechnologies used: \n• Azure Functions \n• pdf.js \n• JavaScript \n• Node.js \n \nGitHub: https://github.com/m-gagne/PDF2AzSearch \n ",
          "last_updated": "2017-05-23T20:10:31.653Z",
          "meta": {
            "Title": "PDF to Text Function",
            "Author": "Marc Gagne",
            "Description": "An azure function that extracts text from PDFs, runs the regular expression captures found in rules.json",
            "Technologies": [
              "Azure Functions",
              "pdf.js",
              "JavaScript",
              "Node.js"
            ]
          }
        }

## Why

Originally I created an [Azure Function called PDF2Search](https://github.com/m-gagne/PDF2AzSearch) that extracted text from a PDF file when stored in an Azure Storage blob container and realized it should exist outside of that project to be used elsewhere.

Primarily it's helpful for people/organizations that have PDF documents of a specific format that makes running regular expressions against them to extract metadata possible. The idea being that the extracted text & metadata can be indexed using [Azure Search](https://azure.microsoft.com/en-us/services/search/) to more easily find the relevant document.