'use strict';

const Route      = require('./route');
const Priorities = require('./priorities');
const RouteList  = require('./route-list');

class RouteGroup {
  /**
   * RouteGroup was designed to pass it's context to nested groups.
   * The specific use case was controllers can be passed in and 
   * their routes configured bound to the "parent" object
   *
   * The class can also be used an organizational grouping, just 
   * make sure the context is a falsey value
   *
   * @param  {String}    endpoint
   * @param  {Object}    context
   * @param  {Object}    config
   * @param  {RouteList} list
   */
  constructor(endpoint, context, config, list) {
    config            = config || {};
    this.middleware   = [];
    this.Route        = Route;
    this.RouteList    = RouteList;
    this.list         = this.setupList(list);
    this.endpoint     = endpoint;
    this.context      = context;
    this.config       = config
    this.priority     = config.priority || Priorities.DEFAULT;
    this.isController = config.controller;
  }

  /**
   * Using the list integration attachs the functions below
   * for the group to use for adding routes.
   * 
   * .addRoute(route)
   * .route(endpoint, method, handler, config)
   *
   * @param {Mixed} wraps
   * @return {RouteList}
   */
  setupList(list) {
    list = list || new this.RouteList();
    
    list.integrate(this); 
    return list;
  }


  /**
   * The route mapping should be passed via the config.routes
   * options
   * 
   * @param  {Object} config
   */
  configure(config) {
    const routes = config.routes || {};

    for (const req in routes) {
      const handle = routes[req];
      this.add(req, null, handle, config);
    }
  }

  /**
   * Add a route to the group. Generally used by the 
   * configure functions
   * 
   * @param {String}   endpoint
   * @param {String}   method
   * @param {Function} handler
   * @param {Object}   config
   */
  add(endpoint, method, handler, config) {
    return this.route(endpoint, method, handler, this.context, {
      root: this.endpoint,
      fromController: this.isController,
    });
  }

  /**
   * Get all the routes for the group
   * 
   * @return {Array}
   */
  getAll() {
    return this.list.getAll();
  }

  /**
   * RouteGroup wrappers trickle down into the groups
   * nested routes
   * 
   * @param {Array|Function} wraps
   */
  setWrappers(wraps) {
    if (!wraps) {return;}
    if (!Array.isArray(wraps)) {
      wraps = [wraps]
    }

    this.list.routes.map(route => {
      route.addWrappers(wraps);
    });
  }

  /**
   * Setting the context on the group, resets the context 
   * for the nested routes
   * 
   * @param  {Object} val
   */
  set context(val) {
    if (!val) {return;}
    this._context = val;

    this.list.routes.map(route => {
      route.context = val;
    });
  }
  
  get context() {
    return this._context;
  }

  couple() {
    throw new Error('RouteGroup@couple missing definition');
  }
}

module.exports = RouteGroup;
