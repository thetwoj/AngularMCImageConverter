/**
 * Created by JJ on 9/10/2015.
 */
var app = angular.module('myApp.conversion');

app.factory('ConversionFactory', ['TextureFactory', 'ImageFactory', function(TextureFactory, ImageFactory){
    var textureAverageRgbValues;
    var textureBlockImages;
    var rgbToTextureLookupArray;

    var convertToBlocks = function (resolution) {
        textureAverageRgbValues = TextureFactory.textureAverageRgbValues;
        textureBlockImages = TextureFactory.textureBlockImages;
        rgbToTextureLookupArray = TextureFactory.rgbToTextureLookupArray;

        var sourceCanvas = document.getElementById('imageCanvas');
        var outputCanvas = document.getElementById('outputCanvas');
        var secretCanvas = document.getElementById('secretCanvas');

        outputCanvas.width = sourceCanvas.width * 16/resolution;
        outputCanvas.height = sourceCanvas.height * 16/resolution;

        secretCanvas.width = outputCanvas.width;
        secretCanvas.height = outputCanvas.height;

        var imageAverageData = createArray(Math.floor(sourceCanvas.width/resolution), Math.floor(sourceCanvas.height/resolution));
        var blockOutputData = createArray(Math.floor(sourceCanvas.width/resolution), Math.floor(sourceCanvas.height/resolution));

        imageAverageData = averageSourceRectangles(sourceCanvas, resolution, imageAverageData);
        blockOutputData = ditherImageToBlocks(imageAverageData, blockOutputData);

        drawConversionOutput(outputCanvas, blockOutputData);
        drawConversionOutput(secretCanvas, blockOutputData);
    };

    function ditherImageToBlocks(imageAverageData, blockOutputData) {
        for (var x = 0; x < imageAverageData.length; x += 1) {
            for (var y = 0; y < imageAverageData[x].length; y += 1) {

                var w = imageAverageData.length;
                var h = imageAverageData[x].length;

                var closestBlockIndex = findLookupTableBlock(imageAverageData[x][y]);

                var oldColor = imageAverageData[x][y];
                var newColor = textureAverageRgbValues[closestBlockIndex];

                var err = oldColor.sub(newColor);

                if (x+1 < w)                {imageAverageData[x+1][y].add(err.mult(7./16));}
                if (x-1 >= 0 && y+1 < h)    {imageAverageData[x-1][y+1].add(err.mult(3./16));}
                if (y+1 < h)                {imageAverageData[x][y+1].add(err.mult(5./16));}
                if (x+1 < w && y+1 < h)     {imageAverageData[x+1][y+1].add(err.mult(1./16));}

                blockOutputData[x][y] = closestBlockIndex;
            }
        }
        return blockOutputData;
    }

    function averageSourceRectangles(sourceCanvas, resolution, imageAverageData){
        var sourceCtx = sourceCanvas.getContext('2d');
        var entireImage = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height).data;

        for (var x = 0; x <= sourceCanvas.width - resolution; x += resolution) {
            for (var y = 0; y <= sourceCanvas.height - resolution; y += resolution) {
                var currentRectangle = ImageFactory.getImageRectangle(entireImage, x, y, resolution, resolution, sourceCanvas);
                var blockTotals = {'r':0, 'g':0, 'b':0};

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
                imageAverageData[x/resolution][y/resolution] = new ImageFactory.rgbValue(
                    Math.floor(blockTotals['r']/(resolution*resolution)),
                    Math.floor(blockTotals['g']/(resolution*resolution)),
                    Math.floor(blockTotals['b']/(resolution*resolution))
                );
            }
        }
        return imageAverageData;
    }

    function drawConversionOutput(outputCanvas, blockOutputData){
        var outputCtx = outputCanvas.getContext('2d');
        for (var x = 0; x < blockOutputData.length; x += 1) {
            for (var y = 0; y < blockOutputData[x].length; y += 1) {
                var currentBlockImage = textureBlockImages[blockOutputData[x][y]];
                outputCtx.putImageData(currentBlockImage, x * 16, y * 16);
            }
        }
    }

    function findLookupTableBlock(sourceRgbValue){
        return rgbToTextureLookupArray
            [Math.max(0,Math.min(31,Math.floor(sourceRgbValue.rValue/8)))]
            [Math.max(0,Math.min(31,Math.floor(sourceRgbValue.gValue/8)))]
            [Math.max(0,Math.min(31,Math.floor(sourceRgbValue.bValue/8)))];
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
        convertToBlocks: convertToBlocks
    }
}]);