/**
 * Created by JJ on 9/16/2015.
 */
var app = angular.module('myApp.conversion');

var CANVAS_DIMENSIONS = 540;

app.factory('ImageFactory', ['$q', function($q) {
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

  function uploadImage(file) {
    var deferred = $q.defer();
    if (file && !file.$error) {
      var sourceCanvas = document.getElementById('secretSourceCanvas');
      var sourceCtx = sourceCanvas.getContext('2d');
      var zoomSourceCanvas = document.getElementById('zoomSourceCanvas');
      var zoomSourceCtx = zoomSourceCanvas.getContext('2d');

      var uploadedImg = new Image;
      uploadedImg.src = URL.createObjectURL(file);

      uploadedImg.onload = function () {
        sourceCanvas.width = uploadedImg.width;
        sourceCanvas.height = uploadedImg.height;
        sourceCtx.drawImage(uploadedImg, 0, 0);

        zoomSourceCanvas.height = CANVAS_DIMENSIONS;
        zoomSourceCanvas.width = CANVAS_DIMENSIONS;

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
        /*
        Resolve the promise now that the source image is done loading
         */
        deferred.resolve({
          initialDrawScale: initialDrawScale
        });
      }
    }
    return deferred.promise;
  };

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

  function drawInitialOutput(scale) {
    var secretSourceCanvas = document.getElementById('secretSourceCanvas');
    var secretOutputCanvas = document.getElementById('secretOutputCanvas');
    var zoomOutputCanvas = document.getElementById('zoomOutputCanvas');
    var zoomOutputCanvas = zoomOutputCanvas.getContext('2d');

    zoomOutputCanvas.drawImage(secretOutputCanvas,
      0, 0,
      secretOutputCanvas.width,
      secretOutputCanvas.height,
      0, 0,
      secretSourceCanvas.width * scale,
      secretSourceCanvas.height * scale);

    /*
    var xScale = zoomOutputCanvas.width / CANVAS_DIMENSIONS;
    var yScale = zoomOutputCanvas.height / CANVAS_DIMENSIONS;

    return {
      xScale: xScale,
      yScale: yScale
    }
    */
    return;
  };

  //function scaleImage(canvas, scale, xScale, yScale) {
  function scaleImages(sourceCanvas, outputCanvas, scale) {
    var sourceCtx = sourceCanvas.getContext('2d');
    var outputCtx = outputCanvas.getContext('2d');
    var secretSourceCanvas = document.getElementById('secretSourceCanvas');
    var secretOutputCanvas = document.getElementById('secretOutputCanvas');

    sourceCtx.clearRect(0, 0, CANVAS_DIMENSIONS, CANVAS_DIMENSIONS);
    outputCtx.clearRect(0, 0, CANVAS_DIMENSIONS, CANVAS_DIMENSIONS);

    //var xSourceScalar = Math.min(1, 1/xScale);
    //var ySourceScalar = Math.min(1, 1/yScale);

    var drawWidth = Math.min(secretSourceCanvas.width * scale, CANVAS_DIMENSIONS);
    var drawHeight = Math.min(secretSourceCanvas.height * scale, CANVAS_DIMENSIONS);

    sourceCtx.drawImage(secretSourceCanvas, 0, 0,
      secretSourceCanvas.width * 1/scale,
      secretSourceCanvas.height * 1/scale,
      0, 0, drawWidth, drawHeight);

    outputCtx.drawImage(secretOutputCanvas, 0, 0,
      secretOutputCanvas.width * 1/scale,
      secretOutputCanvas.height * 1/scale,
      0, 0, drawWidth, drawHeight);
  }

  return {
    rgbValue: rgbValue,
    uploadImage: uploadImage,
    drawInitialOutput: drawInitialOutput,
    scaleImages: scaleImages,
    getImageRectangle: getImageRectangle
  }
}]);