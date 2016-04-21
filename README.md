## route-depot
[![NPM Version][npm-image]][npm-url] <br />

## About
A number of http routers adding routes immediately attach to the router which means 
you can't add routes out of order. The route depot allows you to specify the priortity, 
as well as have an info bank of all the routes that can be filtered, decorated,
and/or wrap the request handlers. It was originally designed to deal with the pain points
of registering controllers and ensuring contexts are maintained.


## Install
`npm install route-depot`


## Example
```js
'use strict';

const express    = require('express');
const RouteDepot = require('route-depot');

const depot = RouteDepot.express();

depot.plugin('route', function(route) {
  return route;
});

// Handy plugin that allows us to add
// controller before methods to middlewares
depot.plugin('attach', function(route) {
  if (!route.isController) {
    return route;
  }

  const ctrl = route.context;

  if (ctrl.before) {
    route.middleware.push(
      ctrl.before.bind(ctrl)
    );
  }

  return route;
});

const Ctrl = {
  name: '2-B-Or-Not-2-B',
  before: function(req, res, next) {
    console.log('before-b');
    next();
  },
  getB: function(req, res) {
    console.log(this);
    res.json(this);
  },
  getAllCats : function(req, res) {
    res.json({d: ['fluffy', 'mittens']})
  },
  routes : {
    'GET  /b' : 'getB',
    'GET /cats' : 'getAllCats'
  }
}

depot.controller('/', Ctrl);

depot.get('/', function(req, res) {
  res.send('I am root');
});

depot.get('/single', function(req, res) {
  res.send('If yur not first yur last!');
});

depot.get('/single', function(req, res) {
  res.send('I be first!');
}, {priority: 1});

const app = express();

depot.couple(app);

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});


````

[npm-image]: https://img.shields.io/npm/v/route-depot.svg
[npm-url]: https://npmjs.org/package/route-depot