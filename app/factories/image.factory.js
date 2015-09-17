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

  var uploadImage = function (file) {
    if (file && !file.$error) {
      var sourceCanvas = document.getElementById('imageCanvas');
      var sourceCtx = sourceCanvas.getContext('2d');
      var img = new Image;
      img.src = URL.createObjectURL(file);

      img.onload = function () {
        sourceCanvas.width = img.width;
        sourceCanvas.height = img.height;
        sourceCtx.drawImage(img, 0, 0);
      }
    }
  };

  function getSourceImageRectangle(entireImage, x, y, width, height, canvas) {
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

  return {
    rgbValue: rgbValue,
    uploadImage: uploadImage,
    getSourceImageRectangle: getSourceImageRectangle
  }
}]);