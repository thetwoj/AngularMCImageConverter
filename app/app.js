'use strict';

// Declare app level module which depends on views, and components
var app = angular.module('myApp', [
  'ngRoute',
  'ngFileUpload',
  'ui.bootstrap',
  'ui.bootstrap-slider',
  'myApp.conversion'
]);

app.config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/pages/conversion'});
}]);