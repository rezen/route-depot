'use strict';

const Hapi       = require('hapi');
const HttpDevice = require('./http-device-ha');
const RouteDepot = require('../index');

const depot = RouteDepot.hapi();

depot.Route.wrappers = [
  function(conn, next, route, handle) {
    console.log('Hey, ya wrapped');
    next();
  },
];

depot.plugin('attach', function(route) {
  if (typeof route.context === 'function' && route.isController) {
    route.context = new route.context('inject', 'deps');

    if (route.context.before) {}
  }

  return route;
});

depot.get('/single', function(request, reply) {
  reply('route-single');
});

depot.addRoute(new depot.Route('/', 'GET', function(request, reply) {
  reply(this);
}, {
  name: 'Bob', 
  cats: 'meow'
}));


depot.controller('/devices/', HttpDevice);

const server = new Hapi.Server();
server.connection({ 
    host: 'localhost', 
    port: 8000 
});

depot.couple(server);

server.start((err) => {
  if (err) {
    throw err;
  }
  console.log('Server running at:', server.info.uri);
});