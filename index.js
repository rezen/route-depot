'use strict';

const RouteDepot = require('./route-depot');

const setup = {
    create: function(coupler, logger) {
        if (typeof coupler === 'string') {
            coupler = require('./couple-' + coupler);
        }

        const depot = RouteDepot.create(coupler, logger);
        return depot;
    },
    express:  function(logger) {
        return setup.create('express', logger);
    },
    hapi: function(logger) {
        return setup.create('hapi', logger);
    }
};

module.exports = setup;
