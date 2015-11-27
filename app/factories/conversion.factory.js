/**
 * Created by JJ on 9/10/2015.
 */
var app = angular.module('myApp.conversion');

app.factory('ConversionFactory', ['TextureFactory', 'ImageFactory', function(TextureFactory, ImageFactory){
  var textureAverageRgbValues;
  var textureBlockImages;
  var rgbToTextureLookupArray;

  /*
  "Master" function that calls all the sub-functions necessary to convert
  the source image to the blocks provided in the texture files
   */
  var convertToBlocks = function (resolution) {
    textureAverageRgbValues = TextureFactory.textureAverageRgbValues;
    textureBlockImages = TextureFactory.textureBlockImages;
    rgbToTextureLookupArray = TextureFactory.rgbToTextureLookupArray;

    // Set the dimensions of the secret output canvas based on the
    // secret source image canvas and the selected resolution value
    var secretSourceCanvas = document.getElementById('secretSourceCanvas');
    var secretOutputCanvas = document.getElementById('secretOutputCanvas');
    secretOutputCanvas.width = secretSourceCanvas.width * (16/resolution);
    secretOutputCanvas.height = secretSourceCanvas.height * (16/resolution);

    // Create the arrays that will hold the output data, taking the floor of the resolution
    // division so that we don't try to access source image pixel values that don't exist
    var imageAverageData = createArray(Math.floor(secretSourceCanvas.width/resolution),
      Math.floor(secretSourceCanvas.height/resolution));
    var blockOutputData = createArray(Math.floor(secretSourceCanvas.width/resolution),
      Math.floor(secretSourceCanvas.height/resolution));

    // Populate output data arrays
    imageAverageData = averageSourceRectangles(secretSourceCanvas, resolution, imageAverageData);
    blockOutputData = ditherImageToBlocks(imageAverageData, blockOutputData);

    // Draw the output data to the secret output canvas
    drawConversionOutput(secretOutputCanvas, blockOutputData);
  };

  /*
  Function that performs the translation from the average RGB values of the source image
  rectangles to the output blocks via the 3D "lookup table" and then dithers by computing
  the error between the source image rectangle average and the average of the matched block
   */
  function ditherImageToBlocks(imageAverageData, blockOutputData) {
    for (var x = 0; x < imageAverageData.length; x += 1) {
      for (var y = 0; y < imageAverageData[x].length; y += 1) {

        // Retrieve the current source image rectangle
        var w = imageAverageData.length;
        var h = imageAverageData[x].length;

        // Translate via the 3D "lookup table" and set it
        var closestBlockIndex = findLookupTableBlock(imageAverageData[x][y]);
        blockOutputData[x][y] = closestBlockIndex;

        // Dither based on the averages of the source image rectangle and the matched block
        var oldColor = imageAverageData[x][y];
        var newColor = textureAverageRgbValues[closestBlockIndex];
        // Calculate error
        var err = oldColor.sub(newColor);
        // Propagate error to the appropriate surrounding source image rectangles
        if (x+1 < w)                {imageAverageData[x+1][y].add(err.mult(7./16));}
        if (x-1 >= 0 && y+1 < h)    {imageAverageData[x-1][y+1].add(err.mult(3./16));}
        if (y+1 < h)                {imageAverageData[x][y+1].add(err.mult(5./16));}
        if (x+1 < w && y+1 < h)     {imageAverageData[x+1][y+1].add(err.mult(1./16));}
      }
    }
    return blockOutputData;
  }

  /*
  Calculate the average RGB values of the source image rectangles whose size
  are dependant on the resolution selected by the user
   */
  function averageSourceRectangles(sourceCanvas, resolution, imageAverageData){
    var sourceCtx = sourceCanvas.getContext('2d');
    var entireImage = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height).data;

    for (var x = 0; x <= sourceCanvas.width - resolution; x += resolution) {
      for (var y = 0; y <= sourceCanvas.height - resolution; y += resolution) {
        // Get the current source image rectangle data
        var currentRectangle = ImageFactory.getImageRectangle(entireImage, x, y, resolution, resolution, sourceCanvas);
        var blockTotals = {'r':0, 'g':0, 'b':0};

        // Calculate the cumulative RGB values over the entire rectangle
        for(var index = 0; index < currentRectangle.length; index++) {
          var value = currentRectangle[index];
          if (index % 4 == 0) {
            blockTotals['r'] += value;
          } else if (index % 4 == 1) {
            blockTotals['g'] += value;
          } else if (index % 4 == 2) {
            blockTotals['b'] += value;
          }
        }
        // Compute and store the average RGB value for the current source image rectangle
        imageAverageData[x/resolution][y/resolution] = new ImageFactory.rgbValue(
          Math.floor(blockTotals['r']/(resolution*resolution)),
          Math.floor(blockTotals['g']/(resolution*resolution)),
          Math.floor(blockTotals['b']/(resolution*resolution))
        );
      }
    }
    return imageAverageData;
  }

  /*
  Draw the output data to the secret output canvas
   */
  function drawConversionOutput(outputCanvas, blockOutputData){
    var outputCtx = outputCanvas.getContext('2d');
    for (var x = 0; x < blockOutputData.length; x += 1) {
      for (var y = 0; y < blockOutputData[x].length; y += 1) {
        var currentBlockImage = textureBlockImages[blockOutputData[x][y]];
        outputCtx.putImageData(currentBlockImage, x * 16, y * 16);
      }
    }
  }

  /*
  Find the corresponding block index value for the provided RGB value
   */
  function findLookupTableBlock(sourceRgbValue){
    return rgbToTextureLookupArray
      [Math.max(0,Math.min(31,Math.floor(sourceRgbValue.rValue/8)))]
      [Math.max(0,Math.min(31,Math.floor(sourceRgbValue.gValue/8)))]
      [Math.max(0,Math.min(31,Math.floor(sourceRgbValue.bValue/8)))];
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
    convertToBlocks: convertToBlocks
  }
}]);