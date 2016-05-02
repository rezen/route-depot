'use strict';

const RouteDepot = require('./route-depot');
const Warehouse  = require('./warehouse');

const setup = {
  create(coupler, logger) {
    if (typeof coupler === 'string') {
      coupler = require('./couple-' + coupler);
    }

    const depot = RouteDepot.create(coupler, logger);
    return depot;
  },

  express(logger) {
    return setup.create('express', logger);
  },

  hapi(logger) {
    return setup.create('hapi', logger);
  },

  warehouse() {
    return new Warehouse();
  }
};

module.exports = setup;
