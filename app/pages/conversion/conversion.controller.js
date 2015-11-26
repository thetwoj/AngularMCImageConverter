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
      vm.lastX = 0;
      vm.lastY = 0;
      vm.dragStart;
      vm.dragged;
      vm.sourceImage;

      TextureFactory.textureSource('/assets/textures_full_sides.png');
      vm.hasTextureImage = true;

      vm.uploadImage = function(file) {
        ImageFactory.uploadImage(file).then(function(results) {
          vm.drawScale = results.initialDrawScale;
          vm.hasImage = true;
          vm.sourceImage = results.sourceImage;

          /*
          Set up the mousewheel listeners to allow zooming in/out
           */
          var zoomSourceCanvas = document.getElementById('zoomSourceCanvas');

          zoomSourceCanvas.addEventListener('DOMMouseScroll', handleScroll, false);
          zoomSourceCanvas.addEventListener('mousewheel', handleScroll, false);

          var zoomSourceCtx = zoomSourceCanvas.getContext('2d');

          var zoomOutputCanvas = document.getElementById('zoomOutputCanvas');
          var zoomOutputCtx = zoomOutputCanvas.getContext('2d');

          trackTransforms(zoomSourceCtx);
          zoomSourceCtx.scale(vm.drawScale,vm.drawScale);
          redraw();

          /*
          Handle dragging image
           */
          zoomSourceCanvas.addEventListener('mousedown',function(evt){
            document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
            vm.lastX = evt.offsetX || (evt.pageX - zoomSourceCanvas.offsetLeft);
            vm.lastY = evt.offsetY || (evt.pageY - zoomSourceCanvas.offsetTop);
            vm.dragStart = zoomSourceCtx.transformedPoint(vm.lastX,vm.lastY);
            vm.dragged = false;
          },false);
          zoomSourceCanvas.addEventListener('mousemove',function(evt){
            vm.lastX = evt.offsetX || (evt.pageX - zoomSourceCanvas.offsetLeft);
            vm.lastY = evt.offsetY || (evt.pageY - zoomSourceCanvas.offsetTop);
            vm.dragged = true;
            if (vm.dragStart){
              var pt = zoomSourceCtx.transformedPoint(vm.lastX,vm.lastY);
              zoomSourceCtx.translate(pt.x-vm.dragStart.x,pt.y-vm.dragStart.y);
              zoomOutputCtx.translate((pt.x-vm.dragStart.x) * (16/vm.resolution),
                (pt.y-vm.dragStart.y) * (16/vm.resolution));
              redraw();
            }
          },false);
          zoomSourceCanvas.addEventListener('mouseup',function(evt){
            vm.dragStart = null;
            redraw();
          },false);

        }, function(results){
          console.log('error - ' + results);
        });
      };

      /*
      Compute the output image from the supplied source image
       */
      vm.analyzeImage = function() {
        var zoomOutputCanvas = document.getElementById('zoomOutputCanvas');
        var zoomSourceCanvas = document.getElementById('zoomSourceCanvas');
        var zoomSourceCtx = zoomSourceCanvas.getContext('2d');
        var zoomOutputCtx = zoomOutputCanvas.getContext('2d');
        if (!zoomOutputCanvas.listeners) {
          zoomOutputCanvas.addEventListener('DOMMouseScroll', handleScroll, false);
          zoomOutputCanvas.addEventListener('mousewheel', handleScroll, false);
        }

        zoomSourceCtx.setTransform(1,0,0,1,0,0);
        zoomSourceCtx.scale(vm.drawScale, vm.drawScale);
        zoomOutputCtx.setTransform(1,0,0,1,0,0);
        zoomOutputCtx.scale(vm.drawScale * (vm.resolution/16), vm.drawScale * (vm.resolution/16));
        ConversionFactory.convertToBlocks(vm.resolution);
        ImageFactory.drawInitialOutput(1);
        redraw();
      };

      /*
       Handling mouse wheel scroll events

       Heavily references Gavin Kistner's example at http://phrogz.net/tmp/canvas_zoom_to_cursor.html
       */
      var handleScroll = function(evt){
        var delta = evt.wheelDelta ? evt.wheelDelta/120 : evt.detail ? -evt.detail : 0;
        if (delta) {
          if (delta == 1){
            zoom(11/10);
          }
          else if (delta == -1){
            zoom(10/11);
          }
        }
        return evt.preventDefault() && false;
      };

      function redraw(){
        var zoomSourceCanvas = document.getElementById('zoomSourceCanvas');
        var zoomOutputCanvas = document.getElementById('zoomOutputCanvas');
        var secretOutputCanvas = document.getElementById('secretOutputCanvas');
        var zoomSourceCtx = zoomSourceCanvas.getContext('2d');
        var zoomOutputCtx = zoomOutputCanvas.getContext('2d');
        // Clear the entire canvas
        zoomSourceCtx.save();
        zoomOutputCtx.save();
        zoomSourceCtx.setTransform(1,0,0,1,0,0);
        zoomOutputCtx.setTransform(1,0,0,1,0,0);
        zoomSourceCtx.clearRect(0,0,zoomSourceCanvas.width,zoomSourceCanvas.height);
        zoomOutputCtx.clearRect(0,0,zoomOutputCanvas.width,zoomOutputCanvas.height);
        zoomSourceCtx.restore();
        zoomOutputCtx.restore();

        zoomSourceCtx.drawImage(vm.sourceImage,0,0);
        zoomOutputCtx.drawImage(secretOutputCanvas,0,0);
      }

      var zoom = function(scale){
        var zoomSourceCanvas = document.getElementById('zoomSourceCanvas');
        var zoomSourceCtx = zoomSourceCanvas.getContext('2d');

        var zoomOutputCanvas = document.getElementById('zoomOutputCanvas');
        var zoomOutputCtx = zoomOutputCanvas.getContext('2d');

        var pt = zoomSourceCtx.transformedPoint(vm.lastX, vm.lastY);

        zoomSourceCtx.translate(pt.x,pt.y);
        zoomOutputCtx.translate(pt.x * (16/vm.resolution),pt.y * (16/vm.resolution));
        zoomSourceCtx.scale(scale,scale);
        zoomOutputCtx.scale(scale,scale);
        zoomSourceCtx.translate(-pt.x,-pt.y);
        zoomOutputCtx.translate(-pt.x * (16/vm.resolution),-pt.y * (16/vm.resolution));
        redraw();
      };

      function trackTransforms(ctx){
        var svg = document.createElementNS("http://www.w3.org/2000/svg",'svg');
        var xform = svg.createSVGMatrix();
        ctx.getTransform = function(){ return xform; };

        var savedTransforms = [];
        var save = ctx.save;
        ctx.save = function(){
          savedTransforms.push(xform.translate(0,0));
          return save.call(ctx);
        };
        var restore = ctx.restore;
        ctx.restore = function(){
          xform = savedTransforms.pop();
          return restore.call(ctx);
        };

        var scale = ctx.scale;
        ctx.scale = function(sx,sy){
          xform = xform.scaleNonUniform(sx,sy);
          return scale.call(ctx,sx,sy);
        };
        var rotate = ctx.rotate;
        ctx.rotate = function(radians){
          xform = xform.rotate(radians*180/Math.PI);
          return rotate.call(ctx,radians);
        };
        var translate = ctx.translate;
        ctx.translate = function(dx,dy){
          xform = xform.translate(dx,dy);
          return translate.call(ctx,dx,dy);
        };
        var transform = ctx.transform;
        ctx.transform = function(a,b,c,d,e,f){
          var m2 = svg.createSVGMatrix();
          m2.a=a; m2.b=b; m2.c=c; m2.d=d; m2.e=e; m2.f=f;
          xform = xform.multiply(m2);
          return transform.call(ctx,a,b,c,d,e,f);
        };
        var setTransform = ctx.setTransform;
        ctx.setTransform = function(a,b,c,d,e,f){
          xform.a = a;
          xform.b = b;
          xform.c = c;
          xform.d = d;
          xform.e = e;
          xform.f = f;
          return setTransform.call(ctx,a,b,c,d,e,f);
        };
        var pt = svg.createSVGPoint();
        ctx.transformedPoint = function(x,y){
          pt.x=x; pt.y=y;
          return pt.matrixTransform(xform.inverse());
        }
      }
    }
]);