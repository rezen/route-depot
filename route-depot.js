'use strict';

const _s         = require('underscore.string');
const mapper     = require('./route-mapper');
const Priorities = require('./priorities');
const RouteList  = require('./route-list');
const Route      = require('./route');
const RouteGroup = require('./route-group');

/**
 * A number of http routers adding routes immediately attach
 * to the router which means you can't add routes out of order.
 * The route depot allows you to specify the priortity, as well
 * as have an info bank of all the routes that can be used
 * by other services
 * 
 * @todo event emitter
 */
class RouteDepot {
  /**
   * @param  {Object} coupler - coupler connects the defined routes to the http server
   * @param  {Object} mapper  - determines routes of an object
   * @param  {Object} logger
   */
  constructor(coupler, warehouse, mapper, logger) {
    this.plugins    = {};
    this.Priority   = Priorities;
    this.Route      = Route;
    this.RouteGroup = RouteGroup;
    this.RouteList  = RouteList;
    this.routes     = this.setupRoutes();

    this.checkCoupling(coupler);
    this.warehouse = warehouse;
    this.mapper    = mapper;
    this.logger    = logger || console;
  }

  /**
   * Using the list integration attachs the functions below
   * for the depot to use for adding routes.
   *
   * fn: addRoute(route)
   * fn: route(endpoint, method, handler, config)
   *
   * @private
   * @param  {Null|RouteList}
   */
  setupRoutes(list) {
    list = list || new this.RouteList();
    list.integrate(this);
    return list;
  }

  /**
   * Check the coupler to ensure all the definitions exist
   *
   * @param  {Object} coupler
   */
  checkCoupling(coupler, isTest) {
    if (!coupler) { 
      throw new Error('A coupler is required');
    }

    for (const method of ['route', 'depot', 'group']) {
      if (typeof coupler[method] !== 'function') {
        throw new Error('The coupler is missing @' + method)
      }
    }

    /**
     * If you just want to check if the coupler
     * has the expected functions make sure isTest
     * is set
     */
    if (isTest) {
      return;
    }

    this.coupler = coupler;
    this.couple = coupler.depot.bind(this);
    this.Route.prototype.couple = coupler.route;
    this.RouteGroup.prototype.couple = coupler.group;
  }

  /**
   * For handling a GET
   *
   * @param  {String}   endpoint
   * @param  {Function} handler
   * @param  {Object}   config
   */
  get(endpoint, handler, config) {
    this.route(endpoint, 'GET', handler, null, config);
    return this;
  }

  /**
   * For handling a POST
   *
   * @param  {String}   endpoint
   * @param  {Function} handler
   * @param  {Object}   config
   */
  post(endpoint, handler, config) {
    this.route(endpoint, 'POST', handler, null, config);
    return this;
  }

  /**
   * For handling a PUT
   *
   * @param  {String}   endpoint
   * @param  {Function} handler
   * @param  {Object}   config
   */
  put(endpoint, handler, config) {
    this.route(endpoint, 'PUT', handler, null, config);
    return this;
  }

  /**
   * For handling a PATCH
   *
   * @param  {String}   endpoint
   * @param  {Function} handler
   * @param  {Object}   config
   */
  patch(endpoint, handler, config) {
    this.route(endpoint, 'PATCH', handler, null, config);
    return this;
  }

  /**
   * For handling a DELETE
   *
   * @param  {String}   endpoint
   * @param  {Function} handler
   * @param  {Object}   config
   */
  delete(endpoint, handler, config) {
    this.route(endpoint, 'DELETE', handler, null, config);
    return this;
  }

  any(endpoint, handler, config) {
    this.route(endpoint, 'ALL', handler, null, config);
    return this;
  }

  /**
   * Maps HTTP methods to actions on controller
   * for index, create, store, show, edit
   *
   * @param  {String} endpoint
   * @param  {Object} Ctrl
   * @param  {Object} config
   * @return {RouteGroup}
   */
  resource(endpoint, Ctrl, config) {
    config = config || {};
    config.routes = this.mapper.resource(Ctrl, endpoint);
    config.resource = true;
    return this.controller(endpoint, Ctrl, config);
  }

  /**
   * Automatically generate routes for a controller
   * based on the names of the functions
   *
   * @param  {String} endpoint
   * @param  {Object} Ctrl
   * @param  {Object} config
   * @return {RouteGroup}
   */
  implicit(endpoint, Ctrl, config) {
    config = config || {};
    config.routes = this.mapper.implicit(Ctrl);
    config.implicit = true;
    return this.controller(endpoint, Ctrl, config);
  }

  /**
   * Add a controller which with a routes config
   * so that the controller routes will be bound
   * to the controller and not lose context when
   * registering the route
   *
   * @param  {String} endpoint
   * @param  {Object} Ctrl
   * @param  {Object} config
   * @return {RouteGroup}
   */
  controller(endpoint, Ctrl, config) {
    config = config || (Ctrl.config || {});

    if (typeof config === 'number') {
      config = {priority: config};
    }

    if (Ctrl.routes && !config.routes) {
      config.routes = Ctrl.routes;
    }

    if (!config.routes) {
      throw new Error('@controller expects attribute: config.routes');
    }

    if (!config.priority) {
      config.priority = Ctrl.priority || Priorities.DEFAULT;
    }

    config.controller = true;

    const group = new this.RouteGroup(
      endpoint, Ctrl, config,
      new this.RouteList(this.plugins.route)
    );

    group.configure(config);
    return this.addRoute(group);
  }

  /**
   * Get all the routes
   *
   * @return {Array}
   */
  all() {
    return this.routes.all();
  }

  /**
   * Before attaching to the http server, run through
   * this filter - used by @couple plugin
   *
   * @param  {Route|RouteGroup} route
   * @return {Mixed}
   */
  assemble(route) {
    if (!this.plugins.attach) {
      return route;
    }

    return this.plugins.attach.reduce((route_, fn) => {
      return fn(route_, this);
    }, route);
  }

  /**
   * Add plugins to the depot for filtering
   * routes add/or tweaking attaching to the
   * http server
   *
   * @param  {String}   tag
   * @param  {Function} plugin
   */
  plugin(tag, plugin) {
    if (!this.plugins[tag]) {
      this.plugins[tag] = [];
    }

    const handle = ''.concat('onPlugin', _s.classify(tag));

    if (typeof this[handle] === 'function') {
      this[handle](plugin);
    }

    // @todo ensure plugin is not added twice
    this.plugins[tag].push(plugin);
    return this;
  }

  /**
   * Event handler for route plugin
   *
   * @param  {Object} plugin
   */
  onPluginRoute(plugin) {
    this.routes.addFilter(plugin);
  }

  couple() {
    throw new Error('RouteDepot@couple missing definition');
  }

  static create(coupler, warehouse, logger) {
    return new RouteDepot(coupler, warehouse, mapper, logger || console);
  }
}

module.exports = RouteDepot;
