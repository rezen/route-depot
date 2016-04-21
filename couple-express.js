'use strict';

const express = require('express');

/**
 * These functions are used to attach to the appropriate
 * http interface
 * 
 * @type {Object}
 */
module.exports = {

  /**
   * Plugins we want to attach to the depot
   * @type {Object}
   */
  plugins: {},

  /**
   * This function is bound to RouteDepot@couple
   * 
   * @param  {Object} app - express instance, aka express()
   * @return {Object}
   */
  depot: function(app) {
    return this.getAll().reduce((http, route) => {
      const router = express.Router();
      route = this.preAttach(route);
      route.couple(router);
      http.use(route.endpoint, router);
      return http;
    }, app);
  },

  /**
   * This function is bound to Route@couple
   *
   * @param  {Object} router - express router instance express.Router();
   * @return {Object}
   */
  route: function(router) {
    const args = this.getHandlers();
    args.unshift(this.path);
    // @todo for debug
    if (!router.$id) {router.$id =  Math.random();}
    router[this.method].apply(router, args);
    return router;
  },

  /**
   * This function is bound to RouteGroup@couple
   *
   * @param  {Object} router - express router instance express.Router();
   * @return {Object}
   */
  group: function(router) {
    this.middleware.map(fn => {
      router.use(fn);
    });

    return this.getAll().reduce((router_, route) => {
      return route.couple(router_);
    }, router);
  }
};
