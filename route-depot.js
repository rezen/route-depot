'use strict';

const mapper     = require('./route-mapper');
const Priorities = require('./priorities');
const RouteList  = require('./route-list');
const Route      = require('./route');
const RouteGroup = require('./route-group');

class RouteDepot {
  /**
   * A number of http routers adding routes immediately attach
   * to the router which means you can't add routes out of order.
   * The route depot allows you to specify the priortity, as well 
   * as have an info bank of all the routes that can be used 
   * by other services
   * 
   * @param  {Object} coupler - coupler connects the defined routes to the http server
   * @param  {Object} mapper  - determines routes of an object
   * @param  {Object} logger
   */
  constructor(coupler, mapper, logger) {
    this.plugins    = {};
    this.Priority   = Priorities;
    this.Route      = Route;
    this.RouteGroup = RouteGroup;
    this.RouteList  = RouteList;
    this.list       = this.setupList();
  
    this.checkCoupling(coupler);
    this.mapper  = mapper;
    this.logger  = logger || console;
  }

  setupList(list) {
    list = list || new this.RouteList();
    /**
     * Using the list integration attachs the functions below
     * for the depot to use for adding routes.
     * 
     * .addRoute(route)
     * .route(endpoint, method, handler, config)
     */
    list.integrate(this); 
    return list;
  }

  /**
   * Check the coupler to ensure all the definitions exist
   * 
   * @param  {Object} coupler
   */
  checkCoupling(coupler) {
    for (const method of ['route', 'depot', 'group']) {
      if (typeof coupler[method] !== 'function') {
        throw new Error('The coupler is missing @' + method)
      }
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

    const group  = new this.RouteGroup(
      endpoint, Ctrl, config, 
      new this.RouteList(this.plugins.route)
    );
   
    group.configure(config);
    return this.addRoute(group);
  }

  getAll() {
    return this.list.getAll();
  }

  /**
   * Before attaching to the http server, run through
   * this filter - used by @couple plugin
   *
   * @param  {Route|RouteGroup} route
   * @return {Mixed}
   */
  preAttach(route) {
    if (!this.plugins.attach) {
      return route;
    }

    return this.plugins.attach.reduce((acc, fn) => {
      return fn(acc);
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

    if (tag === 'route') {
      this.list.addFilter(plugin);
    }

    // @todo ensure plugin is not added twice
    this.plugins[tag].push(plugin);
    return this;
  }

  couple() {
    throw new Error('RouteDepot@couple missing definition');
  }

  static create(coupler, logger) {
    return new RouteDepot(coupler, mapper, logger || console);
  }
}

module.exports = RouteDepot;
