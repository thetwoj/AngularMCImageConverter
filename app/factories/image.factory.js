/**
 * Created by JJ on 9/16/2015.
 */
var app = angular.module('myApp.conversion');

/*
Constant the indicates the height/width of the visible source/output canvases
 */
var MAX_CANVAS_DIMENSION = 540;

app.factory('ImageFactory', ['$q', function($q) {
  /*
  Function that manages common RGB math
   */
  function rgbValue(rValue, gValue, bValue) {
    this.rValue = rValue;
    this.gValue = gValue;
    this.bValue = bValue;
    this.sub = function (otherRgbValue) {
      this.rValue = this.rValue - otherRgbValue.rValue;
      this.gValue = this.gValue - otherRgbValue.gValue;
      this.bValue = this.bValue - otherRgbValue.bValue;
      return this;
    };
    this.add = function (otherRgbValue) {
      this.rValue = this.rValue + otherRgbValue.rValue;
      this.gValue = this.gValue + otherRgbValue.gValue;
      this.bValue = this.bValue + otherRgbValue.bValue;
      return this;
    };
    this.mult = function (multValue) {
      this.rValue = this.rValue * multValue;
      this.gValue = this.gValue * multValue;
      this.bValue = this.bValue * multValue;
      return this;
    };
  }

  /*
  Function that handles the initial uploading of the image and setting the secretSourceCanvas
  and zoomSourceCanvas
   */
  function uploadImage(file) {
    // Use $q so that we can return a promise the will resolve when the image finishes loading
    var deferred = $q.defer();
    if (file && !file.$error) {
      var secretSourceCanvas = document.getElementById('secretSourceCanvas');
      var secretOutputCanvas = document.getElementById('secretOutputCanvas');
      var zoomSourceCanvas = document.getElementById('zoomSourceCanvas');
      var zoomOutputCanvas = document.getElementById('zoomOutputCanvas');
      var secretSourceCtx = secretSourceCanvas.getContext('2d');
      var secretOutputCtx = secretOutputCanvas.getContext('2d');
      var zoomSourceCtx = zoomSourceCanvas.getContext('2d');
      var zoomOutputCtx = zoomOutputCanvas.getContext('2d');

      // Clear all current canvases
      secretSourceCtx.clearRect(0, 0, secretSourceCanvas.width, secretSourceCanvas.height);
      secretOutputCtx.clearRect(0, 0, secretOutputCanvas.width, secretOutputCanvas.height);
      zoomSourceCtx.clearRect(0, 0, zoomSourceCanvas.width, zoomSourceCanvas.height);
      zoomOutputCtx.clearRect(0, 0, zoomOutputCanvas.width, zoomOutputCanvas.height);

      var uploadedImg = new Image;
      uploadedImg.src = URL.createObjectURL(file);

      // When the image finishes uploading update the secret and visible source canvases
      uploadedImg.onload = function () {
        secretSourceCanvas.width = uploadedImg.width;
        secretSourceCanvas.height = uploadedImg.height;
        secretSourceCtx.drawImage(uploadedImg, 0, 0);

        // Use fractional exponents to get a min and max resolution of output that scales well with image resolution
        // Limit resolutionMin to a low of 9 because the matrix transforms start to get really out of hand beyond that
        var resolutionMin = Math.floor(Math.max(Math.sqrt(Math.pow(uploadedImg.width * uploadedImg.height, 1/3)), 9));
        var resolutionMax = Math.floor(Math.max(Math.pow(uploadedImg.width * uploadedImg.height, 1/4), 1));

        zoomSourceCanvas.height = MAX_CANVAS_DIMENSION;
        zoomSourceCanvas.width = MAX_CANVAS_DIMENSION;
        zoomOutputCanvas.height = MAX_CANVAS_DIMENSION;
        zoomOutputCanvas.width = MAX_CANVAS_DIMENSION;

        var initialDrawScale;

        if ((uploadedImg.height > MAX_CANVAS_DIMENSION) || (uploadedImg.width > MAX_CANVAS_DIMENSION)) {
          var ySourceScale = zoomSourceCanvas.height / uploadedImg.height;
          var xSourceScale = zoomSourceCanvas.width / uploadedImg.width;
          initialDrawScale = Math.min(ySourceScale, xSourceScale);

          if (uploadedImg.width > uploadedImg.height) {
            zoomSourceCanvas.height = initialDrawScale < 1 ? uploadedImg.height * initialDrawScale : uploadedImg.height;
            zoomOutputCanvas.height = initialDrawScale < 1 ? uploadedImg.height * initialDrawScale : uploadedImg.height;
          }
          if (uploadedImg.height > uploadedImg.width) {
            zoomSourceCanvas.width = initialDrawScale < 1 ? uploadedImg.width * initialDrawScale : uploadedImg.width;
            zoomOutputCanvas.width = initialDrawScale < 1 ? uploadedImg.width * initialDrawScale : uploadedImg.width;
          }

          zoomSourceCtx.scale(initialDrawScale, initialDrawScale);
          zoomSourceCtx.drawImage(uploadedImg, 0, 0);
          zoomSourceCtx.scale(1/initialDrawScale, 1/initialDrawScale);
        } else {
          zoomSourceCanvas.height = uploadedImg.height;
          zoomOutputCanvas.height = uploadedImg.height;
          zoomSourceCanvas.width = uploadedImg.width;
          zoomOutputCanvas.width = uploadedImg.width;

          zoomSourceCtx.drawImage(uploadedImg, 0, 0);
          initialDrawScale = 1.;
        }

        // Resolve the promise now that the source image is done loading
        deferred.resolve({
          initialDrawScale: initialDrawScale,
          sourceImage: uploadedImg,
          resolutionMin: resolutionMin,
          resolutionMax: resolutionMax
        });
      }
    }
    return deferred.promise;
  }

  /*
  Function that returns an array with RGBT data for a given sub-rectangle withing the provided image

  The math is based around the number 4 because the entireImage.subarray call returns
  a 1D array that contains four values for each pixel - R, G, B, and transparency
   */
  function getImageRectangle(entireImage, x, y, width, height, canvas) {
    var rectangleData = [];
    for (var xIndex = x; xIndex < x + width; xIndex += 1) {
      for (var yIndex = y; yIndex < y + height; yIndex += 1) {
        var tempY = yIndex * canvas.width * 4 + 4 * (xIndex + 1);
        var tempX = tempY - 4;
        var tempData = entireImage.subarray(tempX, tempY);
        for (var index = 0; index < tempData.length; index ++) {
          rectangleData.push(tempData[index]);
        }
      }
    }
    return rectangleData;
  }

  /*
  Function responsible for drawing the initial output from the secretOutputCanvas
  to the zoomOutputCanvas
   */
  function drawInitialOutput() {
    var secretOutputCanvas = document.getElementById('secretOutputCanvas');
    var zoomOutputCanvas = document.getElementById('zoomOutputCanvas');
    var zoomOutputCtx = zoomOutputCanvas.getContext('2d');

    zoomOutputCtx.drawImage(secretOutputCanvas, 0, 0);
  }

  return {
    rgbValue: rgbValue,
    uploadImage: uploadImage,
    drawInitialOutput: drawInitialOutput,
    getImageRectangle: getImageRectangle
  }
}]);