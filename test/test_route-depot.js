'use strict';

const sinon      = require('sinon');
const assert     = require('assert');
const Route      = require('../route');
const RouteList  = require('../route-list');
const RouteDepot = require('../route-depot');
const Priorities = require('../priorities');

describe('RouteDepot', () => {
  function noop() {};
  var depot;
  const coupler = {route: noop, depot: noop, group:noop};

  beforeEach(() => {
    depot = new RouteDepot(coupler);
  });

  describe('#constructor', () => {
    it('Should have a routes attribute', () => {
      assert.equal(typeof depot.routes, 'object');
      assert(depot.routes instanceof RouteList);
    });
  });

  describe('#setupRoutes', () => {
    it('Creates list which is an instanceof RouteList', () => {
      const list = depot.setupRoutes();
      assert(list instanceof RouteList);
    });

    it('Provides the depot with @route and @addRoute via RouteList@integrate', () => {
      assert.equal(RouteDepot.prototype.route, undefined);
      assert.equal(RouteDepot.prototype.addRoute, undefined);
      assert.equal(typeof depot.route, 'function');
      assert.equal(typeof depot.addRoute, 'function');
    });

    it('Calls the list\'s integrate function', () => {
      const spy = sinon.spy();
      depot.setupRoutes({integrate: spy});
      assert(spy.called);
    });
  });

  describe('#checkCoupling', () => {

    it('Should throw an error when there is no coupling', () => {
      assert.throws(() => {
        depot.checkCoupling();
      });
    });

    it('Should pass valid coupler', () => {
      depot.checkCoupling(coupler);
    });

    it('Should fail when missing a coupler', () => {
      assert.throws(() => {
        depot.checkCoupling({
          route: noop,
          depot: noop,
        });
      });
    });

    it('Should attach to depot, route, and group', () => {
      depot.checkCoupling(coupler);
      assert.equal(depot.coupler, coupler);
      assert(depot.couple.name === coupler.depot.bind(depot).name);
      assert(depot.Route.prototype.couple === coupler.route);
      assert(depot.RouteGroup.prototype.couple === coupler.group);
    });
  });


  describe('#get', () => {
    it('Should pass endpoint to route', () => {
      const route = {endpoint: '/z', handler: noop, config: {}};
      sinon.spy(depot, 'route');
      depot.get(route.endpoint, route.handler, route.config);
      assert(depot.route.called);
      const args = depot.route.getCall(0).args;

      assert.equal(args[0], route.endpoint);
      assert.equal(args[1], 'GET');
    });
  });
});
