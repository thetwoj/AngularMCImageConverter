/**
 * Created by JJ on 9/16/2015.
 */
var app = angular.module('myApp.conversion');

/*
Constant the indicates the height/width of the visible source/output canvases
 */
var CANVAS_DIMENSIONS = 540;

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
      zoomSourceCtx.clearRect(0, 0, CANVAS_DIMENSIONS, CANVAS_DIMENSIONS);
      zoomOutputCtx.clearRect(0, 0, CANVAS_DIMENSIONS, CANVAS_DIMENSIONS);

      var uploadedImg = new Image;
      uploadedImg.src = URL.createObjectURL(file);

      // When the image finishes uploading update the secret and visible source canvases
      uploadedImg.onload = function () {
        secretSourceCanvas.width = uploadedImg.width;
        secretSourceCanvas.height = uploadedImg.height;
        secretSourceCtx.drawImage(uploadedImg, 0, 0);

        //TODO fix this shitty math for large images
        var resolutionMin = Math.floor(Math.max((uploadedImg.width * uploadedImg.height) / 50000, 1));
        var resolutionMax = Math.floor(Math.max((uploadedImg.width * uploadedImg.height) / 2500, 1));

        zoomSourceCanvas.height = CANVAS_DIMENSIONS;
        zoomSourceCanvas.width = CANVAS_DIMENSIONS;
        zoomOutputCanvas.height = CANVAS_DIMENSIONS;
        zoomOutputCanvas.width = CANVAS_DIMENSIONS;

        var initialDrawScale;

        if ((uploadedImg.height > CANVAS_DIMENSIONS) || (uploadedImg.width > CANVAS_DIMENSIONS)) {
          var ySourceScale = zoomSourceCanvas.height / uploadedImg.height;
          var xSourceScale = zoomSourceCanvas.width / uploadedImg.width;
          initialDrawScale = Math.min(ySourceScale, xSourceScale);

          zoomSourceCtx.scale(initialDrawScale, initialDrawScale);
          zoomSourceCtx.drawImage(uploadedImg, 0, 0);
          zoomSourceCtx.scale(1/initialDrawScale, 1/initialDrawScale);
        } else {
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