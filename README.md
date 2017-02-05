# Angular Minecraft Image Converter

### View [live](http://jj-graham.com/)

Based on the [angular-seed](http://git-scm.com/) skeleton, this is an AngularJS 1.5.X web app that
uses only local browser JS to represent uploaded images in Minecraft blocks at configurable 
resolution.

There are many other applications out there that do similar things but they all rely on fancier
deployments or backend services, this project is intended to rely on nothing but local browser
resources and JavaScript because why not?

The conversion process employs [Floyd Steinberg dithering](https://en.wikipedia.org/wiki/Floyd%E2%80%93Steinberg_dithering)
which is pretty fascinating.

![screenshot](http://i.imgur.com/CXviMmO.png)

Scrolling and zooming are available:

![zoomscroll](http://i.imgur.com/q7JJPBS.png)

### Prerequisites

* NodeJS
* npm
* git

### Getting started

Clone the repo:

```
git clone https://github.com/thetwoj/AngularMCImageConverter.git
```

In the cloned repo, install deps:

```
npm install
```

### Running during dev

Install dev dependencies:

```
npm install --only=dev
```

Invoke gulp's serve script defined in the local gulpfile:

```
gulp serve
```

This will bring up a live, locally hosted version of your app with [browsersync](https://browsersync.io/) (default port: 3000).

### Running in prod

The contents of the `/app` folder in the repo should be sufficient to deploy on a web host of your choosing.
