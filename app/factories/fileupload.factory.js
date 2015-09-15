/**
 * Created by JJ on 9/10/2015.
 */
var app = angular.module('myApp.fileupload');

app.factory('AnalyzeFactory', ['$http', function($http){
    var blockAverageRgbValues = {};
    var blockImages = {};
    var blockLookupTable = createArray(32, 32, 32);
    function rgbValue(rValue, gValue, bValue) {
        this.rValue = rValue;
        this.gValue = gValue;
        this.bValue = bValue;
        this.sub = function(otherRgbValue) {
            this.rValue = this.rValue - otherRgbValue.rValue;
            this.gValue = this.gValue - otherRgbValue.gValue;
            this.bValue = this.bValue - otherRgbValue.bValue;
            return this;
        };
        this.add = function(otherRgbValue){
            this.rValue = this.rValue + otherRgbValue.rValue;
            this.gValue = this.gValue + otherRgbValue.gValue;
            this.bValue = this.bValue + otherRgbValue.bValue;
            return this;
        };
        this.mult = function(multValue){
            this.rValue = this.rValue * multValue;
            this.gValue = this.gValue * multValue;
            this.bValue = this.bValue * multValue;
            return this;
        };
    }

    var terrainSource = function (path) {
        var canvas = document.getElementById('terrainCanvas');
        var ctx = canvas.getContext('2d');
        var img = new Image;
        img.src = path;

        img.onload = function () {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            analyzeTerrain();
        }

        $http.get('/assets/matrixData.txt').then(function(response){
            //console.log(response.data);
            analyzeMatrixData(response.data);
        });
    };

    function analyzeMatrixData(rawMatrixData){
        var rawValues = rawMatrixData.split(';');
        var currentIndex = 0;
        var currentValues = rawValues[currentIndex];
        var currentRepeat = parseInt(currentValues.split(',')[0]);
        var currentBlockIndex = parseInt(currentValues.split(',')[1]);

        for (var r = 0; r < 32; r += 1) {
            for (var g = 0; g < 32; g += 1) {
                for (var b = 0; b < 32; b += 1) {
                    blockLookupTable[r][g][b] = currentBlockIndex;
                    currentRepeat -= 1;

                    if (currentRepeat < 0) {
                        currentIndex += 1;
                        currentValues = rawValues[currentIndex];
                        currentRepeat = parseInt(currentValues.split(',')[0]);
                        currentBlockIndex = parseInt(currentValues.split(',')[1]);
                    }
                }
            }
        }
        console.log(blockLookupTable);
    }

    var analyzeTerrain = function () {
        var canvas = document.getElementById('terrainCanvas');
        var ctx = canvas.getContext('2d');

        var blockIndex = 0;

        for (var y = 0; y <= canvas.height-16; y += 16) {
            for (var x = 0; x <= canvas.width-16; x += 16) {

                var currentRectangle = ctx.getImageData(x, y, 16, 16);
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

                blockImages[blockIndex] = currentRectangle;
                blockAverageRgbValues[blockIndex] = new rgbValue
                (
                    Math.floor(blockTotals['r'] / 256),
                    Math.floor(blockTotals['g'] / 256),
                    Math.floor(blockTotals['b'] / 256)
                );
                blockIndex++;
            }
        }
    };

    var uploadImage = function (file) {
        if (file && !file.$error) {
            var canvas = document.getElementById('imageCanvas');
            var ctx = canvas.getContext('2d');
            var img = new Image;
            img.src = URL.createObjectURL(file);

            img.onload = function () {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
            }
        }
    };

    var analyzeImage = function (resolution) {
        var canvas = document.getElementById('imageCanvas');
        var ctx = canvas.getContext('2d');

        var outputCanvas = document.getElementById('outputCanvas');
        outputCanvas.width = canvas.width * 16/resolution;
        outputCanvas.height = canvas.height * 16/resolution;

        var imageAverageData = createArray(Math.floor(canvas.width/resolution), Math.floor(canvas.height/resolution));
        var blockOutputData = createArray(Math.floor(canvas.width/resolution), Math.floor(canvas.height/resolution));

        /*
        var tempText = '';
        var arrayMatrix = createArray(32, 32, 32);
        for (var r = 0; r < 255; r += 8) {
            for (var g = 0; g < 255; g += 8) {
                for (var b = 0; b < 255; b += 8) {
                    var tempValue = new rgbValue(r, g, b);
                    arrayMatrix[r/8][g/8][b/8] = findClosestBlock(tempValue);
                    tempText += '(' + r + ',' + g + ',' + b + '[' + arrayMatrix[r/8][g/8][b/8] + '])';
                }
            }
        }

        console.log(tempText);
        */

        for (var x = 0; x <= canvas.width - resolution; x += resolution) {
            for (var y = 0; y <= canvas.height - resolution; y += resolution) {
                var currentRectangle = ctx.getImageData(x, y, resolution, resolution).data;
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
                imageAverageData[x/resolution][y/resolution] = new rgbValue(
                    Math.floor(blockTotals['r']/(resolution*resolution)),
                    Math.floor(blockTotals['g']/(resolution*resolution)),
                    Math.floor(blockTotals['b']/(resolution*resolution))
                );
            }
        }

        // Floyd Steinberg dithering
        for (var x = 0; x < imageAverageData.length; x += 1) {
            for (var y = 0; y < imageAverageData[x].length; y += 1) {

                var w = imageAverageData.length;
                var h = imageAverageData[x].length;

                //var closestBlockIndex = findClosestBlock(imageAverageData[x][y]);
                var closestBlockIndex = findLookupTableBlock(imageAverageData[x][y]);

                var oldColor = imageAverageData[x][y];
                var newColor = blockAverageRgbValues[closestBlockIndex];

                var err = oldColor.sub(newColor);

                if (x+1 < w)                {imageAverageData[x+1][y].add(err.mult(7./16));}
                if (x-1 >= 0 && y+1 < h)    {imageAverageData[x-1][y+1].add(err.mult(3./16));}
                if (y+1 < h)                {imageAverageData[x][y+1].add(err.mult(5./16));}
                if (x+1 < w && y+1 < h)     {imageAverageData[x+1][y+1].add(err.mult(1./16));}

                blockOutputData[x][y] = closestBlockIndex;
            }
        }

        var canvas = document.getElementById('terrainCanvas');
        var ctx = canvas.getContext('2d');
        var outputCanvas = document.getElementById('outputCanvas');
        var outputCtx = outputCanvas.getContext('2d');
        var terrainColumns = canvas.width/16;

        for (var x = 0; x < blockOutputData.length; x += 1) {
            for (var y = 0; y < blockOutputData[x].length; y += 1) {

                var currentRectangle = blockImages[blockOutputData[x][y]];
                    /*ctx.getImageData(
                        (blockOutputData[x][y] % (terrainColumns)) * 16,
                        (Math.floor(blockOutputData[x][y] / (terrainColumns)) * 16),
                        16,
                        16
                    );*/

                outputCtx.putImageData(currentRectangle, x * 16, y * 16);
            }
        }
    };

    function findLookupTableBlock(sourceRgbValue){
        return blockLookupTable
            [Math.max(0,Math.min(31,Math.floor(sourceRgbValue.rValue/8)))]
            [Math.max(0,Math.min(31,Math.floor(sourceRgbValue.gValue/8)))]
            [Math.max(0,Math.min(31,Math.floor(sourceRgbValue.bValue/8)))];
    }

    function findClosestBlock(sourceRgbValue){
        var currentMin = null;
        var closestBlockIndex = 0;
        for (var blockIndex = 0; blockIndex < Object.keys(blockAverageRgbValues).length; blockIndex++) {

            var averageDiff =
                Math.pow(blockAverageRgbValues[blockIndex].rValue - sourceRgbValue.rValue, 2) +
                Math.pow(blockAverageRgbValues[blockIndex].gValue - sourceRgbValue.gValue, 2) +
                Math.pow(blockAverageRgbValues[blockIndex].bValue - sourceRgbValue.bValue, 2);

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
        terrainSource: terrainSource,
        uploadImage: uploadImage,
        analyzeImage: analyzeImage
    }
}]);