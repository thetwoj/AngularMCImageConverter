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
  vm.hasTerrainImage = false;
  vm.hasImage = false;
  vm.pixelData = null;
  vm.resolution = 16;

  TextureFactory.textureSource('/assets/textures_full_sides.png');
  vm.hasTerrainImage = true;

  vm.uploadImage = function(file) {
    ImageFactory.uploadImage(file);
    vm.hasImage = true;
  }

  vm.analyzeImage = function(resolution) {
    ConversionFactory.convertToBlocks(resolution);
  }
}]);