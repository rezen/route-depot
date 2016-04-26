'use strict';

const tools      = require('./tools');
const Priorities = require('./priorities');
const Route      = require('./route');
const fnStack    = require('./mixins/fn-stack');

/**
 * @todo pre/post filters
 */
class RouteList {

  constructor(filters, logger) {
    this.filters  = filters || [];
    this.logger   = logger || console;
    this.Route    = Route;
    this.entries  = [];
    this._skipped = 0;
    this.Priority = Priorities;
  }

  /**
   * Add a route to the list
   *
   * @param  {String} endpoint
   * @param  {Mixed}  method  - GET, POST, PUT, PATCH, DELETE
   * @param  {Mixed}  handler - should be a function ...
   * @param  {Object} config  - priority is included here
   */
  route(endpoint, method, handler, context, config) {
    if (typeof method === 'function') {
      config  = handler;
      handler = method;
      method  = null;
    }

    const route = new this.Route(endpoint, method, handler, context, config);
    this.addRoute(route);
    return this;
  }

  /**
   * Throws route through plugin and add to the
   * routes stack if the plugins don't disable
   *
   * @param {Route|RouteGroup} route
   */
  addRoute(route) {
    route = this.prefilter(route);

    if (!route) {
      this._skipped++;
      return route;
    }

    const order = this.entries.push(route) - 1;
    route.order = route.order || order;
    return route;
  }

  /**
   * Allows objects to use route list api. Will
   * only attach functions to object if the function
   * names don't already exist
   *
   * @param  {Object} object
   */
  integrate(object) {
    if (!object.route) {
      object.route = this.route.bind(this);
    }

    if (!object.addRoute) {
      object.addRoute = this.addRoute.bind(this);
    }
  }

  /**
   *  Routes are passed through this filter
   *  before adding to the depot
   *
   * @param  {Route|RouteGroup} route
   * @return {Mixed}
   */
  prefilter(route) {
    const layers = this.collectFilters(this.filters);

    if (!layers.length === 0) {
      return route;
    }

    return layers.reduce((acc, fn) => {
      return fn(acc);
    }, route);
  }

  // @todo
  // postfilter(route) {}

  /**
   * Get all routes sorted by priority
   *
   * @return {Array}
   */
  all() {
    return tools.prioritized(this.entries);
  }
}

fnStack(RouteList, 'filter');

module.exports = RouteList;
