'use strict';

const express    = require('express');
const b          = require('./b');
const HttpDevice = require('./http-device');
const Depot      = require('../index');

const depot = Depot.express();

depot.plugin('attach', function(route) {
  if (!route.isController) {
    return route;
  }

  console.log('Woah!');

  if (typeof route.context === 'function') {
    route.context = new route.context('Zinger');
  }

  const ctrl = route.context;

  if (ctrl.wrap) {
    console.log('wrap!4');
    route.setWrappers( ctrl.wrap.bind(ctrl))
  }

  if (ctrl.before) {
    route.middleware.push(
      ctrl.before.bind(ctrl)
    );
  }

  return route;
});



depot.controller('/', b);

depot.get('/single', function(req, res) {
  res.send('lol single');
});

new depot.Route('/', 'GET', function(req, res, next) {
  res.send('Bob');
});

depot.addRoute(new depot.Route('/', 'GET', function(req, res, next) {
  res.send(this);
}, {name: 'Bob', cats: 'meow'}));


depot.get('/single', function(req, res) {
  res.send('lol single-first');
}, {priority: 12});

depot.route('GET /b2', function(req, res) {
  res.send('lol single');
});

depot.controller('/devices/', HttpDevice);

const http = express();

depot.couple(http);

http.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
