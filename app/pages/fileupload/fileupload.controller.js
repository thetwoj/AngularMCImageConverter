'use strict';

var app = angular.module('myApp.fileupload', ['ngRoute', 'ngFileUpload']);

app.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/pages/fileupload', {
    templateUrl: '/pages/fileupload/index.html',
    controller: 'FileuploadController'
  });
}]);

app.controller('FileuploadController', ['AnalyzeFactory', 'Upload', '$timeout', function(AnalyzeFactory, Upload, $timeout) {
  var vm = this;
  vm.hasTerrainImage = false;
  vm.hasImage = false;
  vm.pixelData = null;
  vm.resolution = 16;

  AnalyzeFactory.terrainSource('/assets/textures_full_sides.png');
  vm.hasTerrainImage = true;

  vm.uploadImage = function(file) {
    AnalyzeFactory.uploadImage(file);
    vm.hasImage = true;
  }

  vm.analyzeImage = function(resolution) {
    AnalyzeFactory.analyzeImage(resolution);
  }

}]);