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
  vm.hasImage = false;

  vm.uploadTerrainImage = function (file) {
    console.log('uploadImage');
    vm.f = file;
    vm.pixelData = '';

    if (file && !file.$error) {
      vm.image = file;

      var canvas = document.getElementById('canvas');
      var ctx = canvas.getContext('2d');
      var img = new Image;
      img.src = URL.createObjectURL(file);

      img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;
        //ctx.fillRect(0, 0, vm.image.width + 20, vm.image.height + 20);
        ctx.drawImage(img, 0, 0);

        vm.hasTerrainImage = true;
      }
    }
  }

  vm.analyze = function () {
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');

    var tempPixelData = '';
    var blockAverageData = {};
    var blockCount = 0;

    for (var y = 0; y < canvas.width-16; y += 16) {
      for (var x = 0; x < canvas.height-16; x += 16) {
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
  }
}]);