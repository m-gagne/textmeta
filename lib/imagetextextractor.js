'use strict';

const objectAssign = require('object-assign');
const https = require('https');
const fs = require('fs');

var ImageTextExtractor = function (options) {
  this.options = objectAssign({}, {
    ocpApiHost: 'eastus2.api.cognitive.microsoft.com',    
    ocpApiPath: '/vision/v1.0/',
    ocpApimSubscriptionKey: process.env.OcpApimSubscriptionKey,
    language: 'en',
    detectOrientation: false,
    mode: "ocr"
  }, options);
}

ImageTextExtractor.prototype = {
  processText: function(data) {
    switch (this.options.mode.toLowerCase()) {
      case "ocr":
        return this.processOcrText(data);
      case "recognizetext":
        return this.processHandwrittenText(data);
      default:
        throw new Exception("Invalid mode option " + this.options.mode + ". Expected 'ocr' or 'recognizeText'.");
    }
  },
  processOcrText: function(data) {
    var text = "";
    var wordCount, i = 0;

    if (!data.regions) {
      return {
        text: "",
        info: {}
      };
    }

    data.regions.forEach((region) => {
      region.lines.forEach((line) => {
        if (text != "") {
          text += "\n";
        }
        wordCount = line.words.length;
        for (i = 0; i < wordCount; i++) {
          text += i > 0 ? " " : "";
          text += line.words[i].text;
        };
      });
    });

    return {
      text: text,
      info: {}
    };
  },
  processHandwrittenText: function(data) {
    console.log("here 1");

    var text = "";
    var wordCount, i = 0;
    
    if (data.status !== "Succeeded") {
      return {
        text: "",
        info: {}
      };
    }

    console.log("here 2");

    data.recognitionResult.lines.forEach((line) => {
      if (text != "") {
        text += "\n";
      }

      text += line.text;
    });

    return {
      text: text,
      info: {}
    };
  },
  getDataFromFile: function(file) {
    if (!fs.existsSync(file)) {
      console.log("Error, could not open file: " + file);
      return;
    }

    return this.getDataFromBuffer(fs.readFileSync(file));
  },
  getDataFromBuffer: function(data) {
    var extract = function(resolve, reject) {

      let path = this.options.ocpApiPath + this.options.mode;
      switch (this.options.mode.toLowerCase()) {
        case "ocr":
          path += '?language=' + this.options.language + '&detectOrientation=' + this.options.detectOrientation;
          break;
        case "recognizetext":
          path += "?handwriting=" + this.options.handwritten;
      }

      const options = {
        host: this.options.ocpApiHost,
        path: path,
        port: 443,
        method: 'POST',
        headers: {
          'content-type': 'application/octet-stream',
          'Ocp-Apim-Subscription-Key': this.options.ocpApimSubscriptionKey
        }  
      };

      console.log(options);

      const req = https.request(options, (res) => {
        res.setEncoding('utf8');
        req.on('error', function(e) {
          console.log('problem with request: ' + e.message);
        });        
        res.on('data', (data) => {
          console.log("Got data");
          var visionData = JSON.parse(data);

          // Was the image successfully processed
          switch(res.statusCode) {
            case 200: // Success
              resolve(this.processText(visionData));  
              return;
            case 400: // Error processing image
              var errorMessage = visionData.message ? visionData.message : "Unknown error processing image";
              console.log(errorMessage);
              reject(message);
              return;
            case 403: // Out of call volume quota
              reject(new Error('Out of call volume quota'));
              return;
            case 429: // Rate limit is exceeded
              reject(new Error('Rate limit is exceeded'));
              return;
          };
        });
      });
      
      console.log(req);
      req.write(data);
      req.end();      
    };
    
    return new Promise(extract.bind(this));
  }
};


module.exports = ImageTextExtractor;