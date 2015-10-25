/**
 * Created by JJ on 9/16/2015.
 */
var app = angular.module('myApp.conversion');

app.factory('ImageFactory', [function() {
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
    if (file && !file.$error) {
      // Get the hidden source image canvas and context
      var sourceCanvas = document.getElementById('imageCanvas');
      var sourceCtx = sourceCanvas.getContext('2d');
      // Get the visible, zoomable canvas and context
      var zoomSourceCanvas = document.getElementById('zoomImageCanvas');
      var zoomSourceCtx = zoomSourceCanvas.getContext('2d');
      var img = new Image;
      img.src = URL.createObjectURL(file);

      img.onload = function () {
        sourceCanvas.width = img.width;
        sourceCanvas.height = img.height;
        sourceCtx.drawImage(img, 0, 0);

        zoomSourceCanvas.height = 500;
        zoomSourceCanvas.width = 500;

        if ((img.height > 500) || (img.width > 500)) {
          var yScale = zoomSourceCanvas.height / img.height;
          var xScale = zoomSourceCanvas.width / img.width;
          var minScale = Math.min(yScale, xScale);

          zoomSourceCanvas.height = img.height * minScale;
          zoomSourceCanvas.width = img.width * minScale;

          zoomSourceCtx.scale(minScale, minScale);
          zoomSourceCtx.drawImage(img, 0, 0);
        } else {
          zoomSourceCanvas.height = img.height;
          zoomSourceCanvas.width = img.width;

          zoomSourceCtx.drawImage(img, 0, 0);
        }
      }
    }
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

  function drawInitialOutput() {
    var zoomSourceCanvas = document.getElementById('zoomImageCanvas');
    var outputCanvas = document.getElementById('outputCanvas');
    var secretCanvas = document.getElementById('secretCanvas');
    var outputCtx = outputCanvas.getContext('2d');
    var yScale = zoomSourceCanvas.height / secretCanvas.height;
    var xScale = zoomSourceCanvas.width / secretCanvas.width;
    var minScale = Math.min(yScale, xScale);

    outputCanvas.height = zoomSourceCanvas.height;
    outputCanvas.width = zoomSourceCanvas.width;
    outputCtx.drawImage(secretCanvas, 0, 0, secretCanvas.width, secretCanvas.height,
      0, 0, outputCanvas.width, outputCanvas.height);

    var iyScale = outputCanvas.height / 1000;
    var ixScale = outputCanvas.width / 1000;

    return {
      minScale: minScale,
      ixScale: ixScale,
      iyScale: iyScale
    }
  };

  function scaleImage(canvas, scale, ixScale, iyScale) {
    var ctx = canvas.getContext('2d');
    var secretCanvas = document.getElementById('secretCanvas');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = Math.min(secretCanvas.width * scale, 1000);
    canvas.height = Math.min(secretCanvas.height * scale, 1000);

    var sourcexScalar = Math.min(1, 1/ixScale);
    var sourceyScalar = Math.min(1, 1/iyScale);

    var drawWidth = Math.min(canvas.width, 1000);
    var drawHeight = Math.min(canvas.height, 1000);

    ctx.drawImage(secretCanvas, 0, 0,
      secretCanvas.width * sourcexScalar,
      secretCanvas.height * sourceyScalar,
      0, 0, drawWidth, drawHeight);
  }

  return {
    rgbValue: rgbValue,
    uploadImage: uploadImage,
    drawInitialOutput: drawInitialOutput,
    scaleImage: scaleImage,
    getImageRectangle: getImageRectangle
  }
}]);