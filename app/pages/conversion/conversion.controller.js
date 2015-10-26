'use strict';

var app = angular.module('myApp.conversion', ['ngRoute', 'ngFileUpload']);

app.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/pages/conversion', {
    templateUrl: '/pages/conversion/index.html',
    controller: 'ConversionController'
  });
}]);

app.controller('ConversionController', ['ConversionFactory', 'TextureFactory', 'ImageFactory',
    function(ConversionFactory, TextureFactory, ImageFactory) {
      var vm = this;
      vm.hasTextureImage = false;
      vm.hasImage = false;
      vm.pixelData = null;
      vm.resolution = 16;
      vm.drawScale = 1.;
      //vm.xScale = 0.;
      //vm.yScale = 0.;

      TextureFactory.textureSource('/assets/textures_full_sides.png');
      vm.hasTextureImage = true;

      vm.uploadImage = function(file) {
        ImageFactory.uploadImage(file).then(function(results) {
          vm.drawScale = results.initialDrawScale;
          vm.hasImage = true;
        }, function(results){
          console.log('error - ' + results);
        });
      };

      vm.analyzeImage = function(resolution) {
        ConversionFactory.convertToBlocks(resolution);
        //var results =
        ImageFactory.drawInitialOutput(vm.drawScale);
        //vm.xScale = results.xScale;
        //vm.yScale = results.yScale;
      };

      vm.changeOutputScale = function(scale) {
        vm.drawScale = vm.drawScale * scale;
        //vm.xScale = vm.xScale * scale;
        //vm.yScale = vm.yScale * scale;
        var zoomSourceCanvas = document.getElementById('zoomSourceCanvas');
        var zoomOutputCanvas = document.getElementById('zoomOutputCanvas');
        ImageFactory.scaleImages(zoomSourceCanvas, zoomOutputCanvas, vm.drawScale);//, vm.xScale, vm.yScale);
      };
    }
]);