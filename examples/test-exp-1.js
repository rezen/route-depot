'use strict';

const express    = require('express');
const RouteDepot = require('../index');

const depot = RouteDepot.express();

depot.plugin('route', function(route) {
  return route;
});

depot.Route.addWrapper(function(conn, next, route, handle) {
  // console.log('add', handle);
  next();
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
  // Because the next single entry has a priority
  // higher that default depot
  res.send('If yur not first yur last!');
});

depot.get('/single', function(req, res, next) {
  const isDistracted = !!(req.query.cat);
  if (isDistracted) {
    return next();
  }
  return res.send('I be first!');
}, {priority: 1});


const app = express();

depot.couple(app);

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});