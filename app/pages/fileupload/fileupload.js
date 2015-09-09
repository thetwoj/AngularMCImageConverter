'use strict';

var app = angular.module('myApp.fileupload', ['ngRoute', 'ngFileUpload']);

app.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/pages/fileupload', {
    templateUrl: '/pages/fileupload/index.html',
    controller: 'FileuploadController'
  });
}]);

app.controller('FileuploadController', ['Upload', '$timeout', function(Upload, $timeout) {
  var vm = this;
  vm.hasTerrainImage = false;
  vm.hasImage = false;
  vm.pixelData = null;

  vm.uploadTerrainImage = function (file) {
    if (file && !file.$error) {
      vm.image = file;

      var canvas = document.getElementById('terrainCanvas');
      var ctx = canvas.getContext('2d');
      var img = new Image;
      img.src = URL.createObjectURL(file);

      img.onload = function () {
        vm.hasTerrainImage = true;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
      }
    }
  };

  vm.uploadImage = function (file) {
    if (file && !file.$error) {
      vm.image = file;

      var canvas = document.getElementById('imageCanvas');
      var outputCanvas = document.getElementById('outputCanvas');
      var ctx = canvas.getContext('2d');
      var img = new Image;
      img.src = URL.createObjectURL(file);

      img.onload = function () {
        vm.hasImage = true;
        canvas.width = img.width;
        canvas.height = img.height;
        outputCanvas.width = img.width;
        outputCanvas.height = img.height;
        ctx.drawImage(img, 0, 0);
      }
    }
  };

  vm.analyzeTerrain = function () {
    var canvas = document.getElementById('terrainCanvas');
    var ctx = canvas.getContext('2d');

    var tempPixelData = '';
    var blockAverageData = {};
    var blockCount = 0;

    for (var y = 0; y < canvas.height-16; y += 16) {
      for (var x = 0; x < canvas.width-16; x += 16) {
        tempPixelData += 'count: ' + blockCount + ' ';

        var currentRectangle = ctx.getImageData(x, y, 16, 16).data;
        var blockTotals = {'r':0, 'g':0, 'b':0};

        for(var index = 0; index < currentRectangle.length; index++) {
          var value = currentRectangle[index];
          if (index % 4 == 0) {
            tempPixelData += '(' + value + ',';
            blockTotals['r'] += value;
          } else if (index % 4 == 1) {
            tempPixelData += value + ',';
            blockTotals['g'] += value;
          } else if (index % 4 == 2) {
            tempPixelData += value + ') ';
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
    vm.pixelData = blockAverageData;
  };

  vm.analyzeImage = function () {
    var canvas = document.getElementById('imageCanvas');
    var ctx = canvas.getContext('2d');

    var imageAverageData = {};
    var blockOutputData = {};
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
        imageAverageData[blockCount] = [
          Math.floor(blockTotals['r']/256),
          Math.floor(blockTotals['g']/256),
          Math.floor(blockTotals['b']/256)
        ];
        blockCount++;
      }
    }

    for(var index = 0; index < Object.keys(imageAverageData).length; index++){
      var currentMin = 255;
      var currentBlock = 0;
      for(var blockIndex = 0; blockIndex < Object.keys(vm.pixelData).length; blockIndex++){
        var averageDiff = Math.floor(Math.abs((
            imageAverageData[index][0] - vm.pixelData[blockIndex][0] +
            imageAverageData[index][1] - vm.pixelData[blockIndex][1] +
            imageAverageData[index][2] - vm.pixelData[blockIndex][2]) / 3));
        if(averageDiff < currentMin) {
          currentMin = averageDiff;
          currentBlock = blockIndex;
        }
      }
      blockOutputData[index] = currentBlock;
    }

    for(var index = 0; index < Object.keys(blockOutputData).length; index++){
      var canvas = document.getElementById('terrainCanvas');
      var ctx = canvas.getContext('2d');
      var outputCanvas = document.getElementById('outputCanvas');
      var outputCtx = outputCanvas.getContext('2d');

      var currentRectangle =
          ctx.getImageData((blockOutputData[index]%16)*16, (Math.floor(blockOutputData[index]/16)*16), 16, 16);
      outputCtx.putImageData(currentRectangle,
          (index%Math.floor(outputCanvas.width/16))*16, Math.floor(index/Math.floor(outputCanvas.width/16))*16
      );
    }
  };
}]);