/**
 * Created by JJ on 9/16/2015.
 */
var app = angular.module('myApp.conversion');

app.factory('TextureFactory', ['$http', 'ImageFactory', function($http, ImageFactory){
  var textureAverageRgbValues = {};
  var textureBlockImages = {};
  var rgbToTextureLookupArray = createArray(32, 32, 32);

  var textureSource = function (path) {
    var canvas = document.getElementById('textureCanvas');
    var ctx = canvas.getContext('2d');
    var img = new Image;
    img.src = path;

    img.onload = function () {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      analyzeTexture();
    }

    $http.get('/assets/matrixData.txt').then(function(response){
      analyzeLookupTableInputData(response.data);
    });
  };

  function analyzeLookupTableInputData(rawMatrixData){
    var rawLookupTableValues = rawMatrixData.split(';');
    var currentIndex = 0;
    var currentValues = rawLookupTableValues[currentIndex];
    var currentRepeat = parseInt(currentValues.split(',')[0]);
    var currentBlockIndex = parseInt(currentValues.split(',')[1]);

    for (var r = 0; r < 32; r += 1) {
      for (var g = 0; g < 32; g += 1) {
        for (var b = 0; b < 32; b += 1) {
          rgbToTextureLookupArray[r][g][b] = currentBlockIndex;
          currentRepeat -= 1;

          if (currentRepeat < 0) {
            currentIndex += 1;
            currentValues = rawLookupTableValues[currentIndex];
            currentRepeat = parseInt(currentValues.split(',')[0]);
            currentBlockIndex = parseInt(currentValues.split(',')[1]);
          }
        }
      }
    }
  }

  function analyzeTexture() {
    var textureCanvas = document.getElementById('textureCanvas');
    var textureCtx = textureCanvas.getContext('2d');
    var blockIndex = 0;

    for (var y = 0; y <= textureCanvas.height-16; y += 16) {
      for (var x = 0; x <= textureCanvas.width-16; x += 16) {
        var currentRectangle = textureCtx.getImageData(x, y, 16, 16);
        var currentRectangleData = currentRectangle.data;
        var blockTotals = {'r':0, 'g':0, 'b':0};

        for(var index = 0; index < currentRectangleData.length; index++) {
          var value = currentRectangleData[index];
          if (index % 4 == 0) {
            blockTotals['r'] += value;
          } else if (index % 4 == 1) {
            blockTotals['g'] += value;
          } else if (index % 4 == 2) {
            blockTotals['b'] += value;
          }
        }

        textureBlockImages[blockIndex] = currentRectangle;
        textureAverageRgbValues[blockIndex] = new ImageFactory.rgbValue
        (
            Math.floor(blockTotals['r'] / 256),
            Math.floor(blockTotals['g'] / 256),
            Math.floor(blockTotals['b'] / 256)
        );
        blockIndex++;
      }
    }
  };

  function loadCustomTexture(){
    var blockLookupRgbData = '';
    var lastBlock = 0;
    var currentBlock = 0;
    var blockCount = 0;
    var firstBlock = true;

    rgbToTextureLookupArray = createArray(32, 32, 32);
    for (var r = 0; r < 255; r += 8) {
      for (var g = 0; g < 255; g += 8) {
        for (var b = 0; b < 255; b += 8) {
          var tempValue = new ImageFactory.rgbValue(r, g, b);
          rgbToTextureLookupArray[r/8][g/8][b/8] = findClosestBlock(tempValue);

          if (currentBlock == lastBlock) {
            blockCount += 1;
            continue;
          }

          if (firstBlock == true) {
            firstBlock = false;
          } else {
            blockLookupRgbData += blockCount + ',' + lastBlock + ';'
          }
        }
      }
    }
    blockLookupRgbData += (blockCount+1) + ',' + lastBlock + ';'
    analyzeLookupTableInputData(blockLookupRgbData);
  }

  function findClosestBlock(sourceRgbValue){
    var currentMin = null;
    var closestBlockIndex = 0;
    for (var blockIndex = 0; blockIndex < Object.keys(textureAverageRgbValues).length; blockIndex++) {
      var averageDiff =
          Math.pow(textureAverageRgbValues[blockIndex].rValue - sourceRgbValue.rValue, 2) +
          Math.pow(textureAverageRgbValues[blockIndex].gValue - sourceRgbValue.gValue, 2) +
          Math.pow(textureAverageRgbValues[blockIndex].bValue - sourceRgbValue.bValue, 2);

      if (currentMin == null) {
        currentMin = averageDiff;
      }
      if (averageDiff < currentMin) {
        currentMin = averageDiff;
        closestBlockIndex = blockIndex;
      }
    }
    return closestBlockIndex;
  }

  function createArray(length) {
    var arr = new Array(length || 0),
        i = length;
    if (arguments.length > 1) {
      var args = Array.prototype.slice.call(arguments, 1);
      while(i--) arr[length-1 - i] = createArray.apply(this, args);
    }
    return arr;
  }

  return {
    textureSource: textureSource,
    textureAverageRgbValues: textureAverageRgbValues,
    textureBlockImages: textureBlockImages,
    rgbToTextureLookupArray: rgbToTextureLookupArray
  }
}]);