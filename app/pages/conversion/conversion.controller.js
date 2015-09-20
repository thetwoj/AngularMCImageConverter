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
  vm.totalScale = 1.;

  TextureFactory.textureSource('/assets/textures_full_sides.png');
  vm.hasTextureImage = true;

  vm.uploadImage = function(file) {
    ImageFactory.uploadImage(file);
    vm.hasImage = true;
  }

  vm.analyzeImage = function(resolution) {
    ConversionFactory.convertToBlocks(resolution);
    vm.totalScale = 1.;
  }

  vm.changeScale = function(scale) {
    vm.totalScale = vm.totalScale * scale;
    var outputCanvas = document.getElementById('outputCanvas');
    ImageFactory.scaleImage(outputCanvas, vm.totalScale);
  }
}]);