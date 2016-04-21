'use strict';

const Priorities = require('./priorities');
const Route      = require('./route');

class RouteList {

  constructor(filters, logger) {
    this.filters  = filters || [];
    this.logger   = logger || console;
    this.Route    = Route;
    this.routes   = [];
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

    config = config || (handler.$config || {});

    if (!config.priority) {
      config.priority = handler.$priority || this.Priority.DEFAULT;
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
    route = this.preAdd(route);

    if (!route) {
      this._skipped ++;
      return route;
    }

    const order = this.routes.push(route) - 1;
    route.order = route.order || order;
    return route;
  }


  /**
   * Pass in a filter that can manipulate route properties
   * or make route ignoreable by returning falsy value
   *
   * @param {Function} fn
   */
  addFilter(fn) {
    if (this.filters.indexOf(fn) !== -1) {
      return false;
    }

    if (typeof fn !== 'function') {
      return false;
    }

    this.filters.push(fn);
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
   * Get all routes sorted by priority
   *
   * @return {Array}
   */
  getAll() {
    return this.routes.slice(0).sort(function(a, b) {
      const x = a.priority || Priorities.DEFAULT; 
      const y = b.priority || Priorities.DEFAULT;
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
  }

  /**
   *  Routes are passed through this filter 
   *  before adding to the depot
   * 
   * @param  {Route|RouteGroup} route
   * @return {Mixed}
   */
  preAdd(route) {
    if (!this.filters.length === 0) {
      return route;
    }

    return this.filters.reduce((acc, fn) => {
      return fn(acc);
    }, route);
  }
}

module.exports = RouteList;
