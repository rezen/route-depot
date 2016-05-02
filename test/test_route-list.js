'use strict';

const sinon      = require('sinon');
const assert     = require('assert');
const Route      = require('../route');
const RouteList  = require('../route-list');
const Priorities = require('../priorities');

describe('RouteList', () => {
  function noop() {};
  var list;

  beforeEach(() => {
    list = new RouteList();
  });

  describe('#constructor', () => {
    it('Should have a filters attribute', () => {
      assert(Array.isArray(list.filters));
    });

    it('Should have an entries attribute', () => {
      assert(Array.isArray(list.entries));
    });
  });

  describe('#integrate', () => {
    it('Provides @route and @addRoute hooks to an object', () => {
      const depot = {};
      list.integrate(depot);
      assert.equal(typeof depot.route, 'function');
      assert.equal(typeof depot.addRoute, 'function');
    });

    it('Wont ovveride the object\'s existing functions' , () => {
      const depot = {route: noop};
      list.integrate(depot);
      assert.equal(typeof depot.route, 'function');
      assert.equal(typeof depot.addRoute, 'function');
      assert.equal(depot.route, noop);
    });
  });

 
  describe('#route', () => {
    function R(request, method, handler, context, config) {
      this.d = {request, method, handler, context, config};
      return this;
    };

    it('Expects an endpoint', () => {
      assert.throws(() => {
        list.route();
      })
    });

    it('Sets the route order', () => {
      list.route('/');
      assert.equal(list.entries.length, 1);
      const route = list.entries[0];
      assert.equal(route.order, 0);
    });

    it('Adds to the route entries', () => {
      list.route('/');
      assert.equal(list.entries.length, 1);
      const route = list.entries[0];
      assert.equal(route.handlers.length, 0);
    });

    it('Passes the appropriate args to the route', () => {
      const route = {request: '/', method: 'GET', handler: noop};
      list.Route = R;
      list.route(route.request, route.method, route.handler);
    
      const r = list.entries[0];

      assert.equal(r.d.request, route.request);
      assert.equal(r.d.method, route.method);
      assert.equal(r.d.handler, route.handler);
    });

    it('Allows a different signature for ', () => {
      const route = {request: '/', handler: noop, config: {a: 'b'}};
      list.Route = R;
      list.route(route.request, route.handler, route.config);
    
      const r = list.entries[0];
      assert.equal(r.d.request, route.request);
      assert.equal(r.d.method, route.method);
      assert.equal(r.d.handler, route.handler);
      assert.equal(r.d.config, route.config);
    });

     
  });
});
