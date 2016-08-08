'use strict';

const RouteDepot = require('./route-depot');
const Warehouse  = require('./warehouse');

const warehouse = new Warehouse();

const setup = {
  create(coupler, logger) {
    if (typeof coupler === 'string') {
      coupler = require('./couple-' + coupler);
    }

    const depot = RouteDepot.create(coupler, warehouse, logger);
    return depot;
  },

  express(logger) {
    return setup.create('express', logger);
  },

  hapi(logger) {
    return setup.create('hapi', logger);
  },

  warehouse() {
    return warehouse;
  }
};

module.exports = setup;
