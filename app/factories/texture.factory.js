/**
 * Created by JJ on 9/16/2015.
 */
var app = angular.module('myApp.conversion');

app.factory('TextureFactory', ['$http', 'ImageFactory', function($http, ImageFactory){
  var textureAverageRgbValues = {};
  var textureBlockImages = {};
  var rgbToTextureLookupArray = createArray(32, 32, 32);

  /*
   "Master" function that kicks off all the computation necessary to analyze source
   images, including populating textureAverageRgbValues, textureBlockImages, and
   textureBlockImages
   */
  function textureSource(path) {
    var canvas = document.getElementById('secretTextureCanvas');
    var ctx = canvas.getContext('2d');
    var img = new Image;
    img.src = path;

    img.onload = function () {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      analyzeTexture();
    };

    $http.get('/assets/matrixData.txt').then(function(response){
      analyzeLookupTableInputData(response.data);
    });
  }

  /*
   Function that parses the raw matrixData.txt file which is formatted as:

   <occurrences>,<blockIndex>;<occurrences>,<blockIndex>;...etc

   This matrixData format is describing a 3D array "lookup table" between RGB values
   and their closest matching block image. The lookup table increments by 8 each iteration,
   in reverse RGB order. The following example statement (if at the beginning of the file)
   would describe that (0,0,0), (0,0,8), (0,0,16), and (0,0,24) will map to block index 44
   while (0,0,32) and (0,0,40) will map to block index 70:

   4,44;2,70;

   This data is used to quickly match a source rectangle with its appropriate replacement
   */
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

  /*
   Function that iterates through a texture map of 16x16 pixel blocks and
   determines the average color value of each block

   This data is used to calculate the error value during dithering
   */
  function analyzeTexture() {
    var textureCanvas = document.getElementById('secretTextureCanvas');
    var textureCtx = textureCanvas.getContext('2d');
    var blockIndex = 0;

    // Iterate through each block by incrementing x/y by 16 pixels
    for (var y = 0; y <= textureCanvas.height-16; y += 16) {
      for (var x = 0; x <= textureCanvas.width-16; x += 16) {
        // Get the current block's image data, set it to the block images
        // array at the current block index
        var currentRectangle = textureCtx.getImageData(x, y, 16, 16);
        textureBlockImages[blockIndex] = currentRectangle;

        // Extract RGBt data from current block's image
        var currentRectangleData = currentRectangle.data;
        var blockTotals = {'r':0, 'g':0, 'b':0};

        // Iterate through RGBt data tracking cumulative values for averaging purposes
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

        // Average the block's RGB values and store them in the average array at
        // the current block index value that corresponds with the image array
        textureAverageRgbValues[blockIndex] = new ImageFactory.rgbValue
        (
          Math.floor(blockTotals['r'] / 256),
          Math.floor(blockTotals['g'] / 256),
          Math.floor(blockTotals['b'] / 256)
        );
        blockIndex++;
      }
    }
  }

  /*
  A nice idea, currently non functional
   */
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
    blockLookupRgbData += (blockCount+1) + ',' + lastBlock + ';';
    analyzeLookupTableInputData(blockLookupRgbData);
  }

  /*
  Function that is currently unused - potentially used by custom textures in the future
   */
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

  /*
  Handy function for easily creating multi-dimensional arrays

  Credit: Matthew Crumley
  http://stackoverflow.com/questions/966225/how-can-i-create-a-two-dimensional-array-in-javascript
   */
  function createArray(length) {
    var arr = new Array(length || 0), i = length;
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