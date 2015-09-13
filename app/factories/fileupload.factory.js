/**
 * Created by JJ on 9/10/2015.
 */
var app = angular.module('myApp.fileupload');

app.factory('AnalyzeFactory', [function(){
    var pixelData = null;

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
    };

    var analyzeTerrain = function () {
        var canvas = document.getElementById('terrainCanvas');
        var ctx = canvas.getContext('2d');

        var blockAverageData = {};
        var blockCount = 0;

        for (var y = 0; y <= canvas.height-16; y += 16) {
            for (var x = 0; x <= canvas.width-16; x += 16) {

                var currentRectangle = ctx.getImageData(x, y, 16, 16).data;
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

                blockAverageData[blockCount] = [
                    Math.floor(blockTotals['r']/256),
                    Math.floor(blockTotals['g']/256),
                    Math.floor(blockTotals['b']/256)
                ];
                blockCount++;
            }
        }
        pixelData = blockAverageData;
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
                imageAverageData[x/resolution][y/resolution] = [
                    Math.floor(blockTotals['r']/(resolution*resolution)),
                    Math.floor(blockTotals['g']/(resolution*resolution)),
                    Math.floor(blockTotals['b']/(resolution*resolution))
                ];
            }
        }

        // Floyd Steinberg dithering
        /*
        for (var x = 0; x < imageAverageData.length; x += 1) {
            for (var y = 0; y < imageAverageData[x].length; y += 1) {

                var w = imageAverageData.length;
                var h = imageAverageData[x].length;

                var currentMin = 255;
                var currentBlock = 0;
                for (var blockIndex = 0; blockIndex < Object.keys(pixelData).length; blockIndex++) {

                    var averageDiff = Math.sqrt(
                        Math.pow(pixelData[blockIndex][0] - imageAverageData[x][y][0], 2) +
                        Math.pow(pixelData[blockIndex][1] - imageAverageData[x][y][1], 2) +
                        Math.pow(pixelData[blockIndex][2] - imageAverageData[x][y][2], 2)
                    );

                    if (averageDiff < currentMin) {
                        currentMin = averageDiff;
                        currentBlock = blockIndex;
                    }
                }

                oldColor = imageAverageData[x][y];
                newColor = pixelData[currentBlock];

                var err = [newColor[0] - oldColor[0], newColor[1] - oldColor[1], newColor[2] - oldColor[2]];

                if (x+1 < w) {
                    imageAverageData[x+1][y] = [
                        imageAverageData[x+1][y][0] + err[0]*7/16,
                        imageAverageData[x+1][y][1] + err[1]*7/16,
                        imageAverageData[x+1][y][2] + err[2]*7/16
                    ];
                }
                if (x-1 >= 0 && y+1 < h) {
                    imageAverageData[x-1][y+1] =[
                        imageAverageData[x-1][y+1][0] + err[0]*3/16,
                        imageAverageData[x-1][y+1][1] + err[1]*3/16,
                        imageAverageData[x-1][y+1][2] + err[2]*3/16
                    ];
                }
                if (y+1 < h) {
                    imageAverageData[x][y+1] = [
                        imageAverageData[x][y+1][0] + err[0]*5/16,
                        imageAverageData[x][y+1][1] + err[1]*5/16,
                        imageAverageData[x][y+1][2] + err[2]*5/16
                    ]
                }
                if (x+1 < w && y+1 < h) {
                    imageAverageData[x+1][y+1] = [
                        imageAverageData[x+1][y+1][0] + err[0]*1/16,
                        imageAverageData[x+1][y+1][1] + err[1]*1/16,
                        imageAverageData[x+1][y+1][2] + err[2]*1/16
                    ]
                }

                blockOutputData[x][y] = currentBlock;
            }
        }*/

        // Nearest color match
        for (var x = 0; x < imageAverageData.length; x += 1) {
            for (var y = 0; y < imageAverageData[x].length; y += 1) {
                var currentMin = 255;
                var currentBlock = 0;
                for (var blockIndex = 0; blockIndex < Object.keys(pixelData).length; blockIndex++) {

                    var averageDiff = Math.sqrt(
                        Math.pow(pixelData[blockIndex][0] - imageAverageData[x][y][0], 2) +
                        Math.pow(pixelData[blockIndex][1] - imageAverageData[x][y][1], 2) +
                        Math.pow(pixelData[blockIndex][2] - imageAverageData[x][y][2], 2)
                    );

                    if (averageDiff < currentMin) {
                        currentMin = averageDiff;
                        currentBlock = blockIndex;
                    }
                }
                blockOutputData[x][y] = currentBlock;
            }
        }

        var canvas = document.getElementById('terrainCanvas');
        var ctx = canvas.getContext('2d');
        var outputCanvas = document.getElementById('outputCanvas');
        var outputCtx = outputCanvas.getContext('2d');
        var terrainColumns = canvas.width/16;

        for (var x = 0; x < blockOutputData.length; x += 1) {
            for (var y = 0; y < blockOutputData[x].length; y += 1) {

                var currentRectangle =
                    ctx.getImageData(
                        (blockOutputData[x][y] % (terrainColumns)) * 16,
                        (Math.floor(blockOutputData[x][y] / (terrainColumns)) * 16),
                        16,
                        16
                    );

                outputCtx.putImageData(currentRectangle, x * 16, y * 16);
            }
        }
    };

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