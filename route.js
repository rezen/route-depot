'use strict';

const url        = require('url');
const async      = require('async');
const namer      = require('./namer');
const Priorities = require('./priorities');

class Route {
  /**
   * We need at least a request and handler to have a route
   *
   * new Route('/disco', 'GET', function() {});
   * new Route('GET /dance', null, function(req, res) {
   *   res.send('dance-party!');
   * });
   * new Route('/eighties', 'GET', function(req, res) {
   *   res.send(this.data);
   * }, {data: {colors: 'neon-*', cars: 'ugly'}});
   *
   * new Route('/unicorns', 'GET', function(req, res) {
   *   res.send(this.data)
   * }, null, {priority: 1});
   * 
   * @param  {String} request
   * @param  {String} method
   * @param  {Function|String} handler
   * @param  {Mixed} context
   * @param  {Object} config
   */
  constructor(request, method, handler, context, config) {
    config        = config || {};
    this._method  = null;
    this._path    = null;
    this.request  = this.parseRequest(request);
    this.method   = method;
    this.config   = config;
    this.handlers = [];
    this.wrappers = [];
    this.priority = config.priority || Priorities.DEFAULT;
    this.name     = config.name || (handler.$name || handler.name);
    this.root     = config.root || false;
    this.order    = config.order || handler.$order || null;
    this.addWrappers(this.constructor.wrappers || []);
    this.addHandler(handler, context || config.binding);
  }

  /**
   * Take a request string and parse path and 
   * possibly the http method
   *
   * @param  {String} request
   */
  parseRequest(request) {
    this._request = request;
    const parts = request.split(' ');

    if (parts.length > 1) {
      this.method = parts.shift();
    }
   
    this.path = parts.filter(s => s.trim() !== '').join('').trim();
  }

  /**
   * What is the full url of the route
   *
   * @return {String}
   */
  url() {
    const tmp = [].concat(
      this.endpoint.split('/'), 
      this.path.split('/')
    ).filter(p => p !== '').join('/');

    return '/'.concat(tmp);
  }

  /**
   * Pass in handler and the context we want the handle to be bound to
   *
   * @param {Mixed} handle
   * @param {Mixed} context
   */
  addHandler(handle, context) {
    if (typeof handle === 'string') {
      this.config.handle = handle;
    }

    this.handlers.push(handle);
    this.context  = context; 
    return this;
  }

  /**
   * Get all the built handlers
   *
   * @return {Array}
   */
  getHandlers() {
    const handles = [].concat.apply([], this.handlers); // flatten if nested arrays
    return handles.map(h => this.buildHandle(h));
  }

  /**
   * Take a handle and bind it with the appropriate context
   * and wrap it in any route wrappers that may exist.
   *
   * @param  {Mixed} handle
   * @return {Function}
   */
  buildHandle(handle) {
    const self = this;
    const fn = this.bindHandle(handle);

    if (this.wrappers.length === 0) {
      return fn;
    }

    // Handles request
    return function onRequest(req, res, next) {
      /**
       *  Pass the handler with the request injected 
       *  so that route handlers can call the handle
       */
      fn.$call = function() {
        fn(req, res, next);
      };

      // The wraps may want to know the origin name
      fn.$call.$meta = {
        name: fn.$handle
      };

      // Request params passed
      const conn = {req, res, next};

      /**
       * connect based http routers middlware have no idea of what the 
       * next request is. Adding wrappers to routes allows us to add 
       * intercept calls to the route and apply logic like acls with
       * information about the route
       */
      async.eachSeries(self.wrappers, function onWrap(wrap, callback) {
        wrap(conn, callback, self, fn.$call);
      }, function onWrapped(err) {
        fn.$call();
      });
    };
  }

  /**
   * If the handle has a context, bind the handle to the context.
   * If handle is string, gets function from context
   *
   * @param  {Mixed}    handle
   * @return {Function}
   */
  bindHandle(handle) {
    var fn = handle;
    var name = ''.concat(handle.name || handle);

    if (this.context) {
      if (typeof handle === 'string') {
        handle = this.context[handle];
      }
        
      fn = handle.bind(this.context);
    }

    fn.$handle = name;
    return fn;
  }

  /**
   * Determine name based off the handlers
   *
   * @return {String}
   */
  nameByHandle() {
   return namer.routeNameByHandlers(this);
  }

  /**
   * Determine name based off url
   * 
   * @return {String}
   */
  nameByUrl() {
    return namer.routeName(this);
  }

  /**
   * Add function wrappers that will execute
   * before the handler is called
   * 
   * @param {Array|Function} wraps
   */
  addWrappers(wraps) {
    if (!Array.isArray(wraps)) {
      wraps = [wraps];
    }

    wraps.map(fn => {
      if (typeof fn !== 'function') {
        return;
      }

      const isNew = (this.wrappers.indexOf(fn) === -1);

      if (isNew) {
        this.wrappers.push(fn);
      }
    })
  }

  couple() {
    throw new Error('Route@couple missing definition');
  }

  set name(val) {
    if (!val) {return;}
    // @todo correct casing on name
    this._name = val;
  }

  get name() {
    return this._name || this.nameByHandle();
  }

  get endpoint() { 
    return this.root ? this.root : this._path; 
  }

  set path(val) { 
    this._path = val; 
  }

  get path() {
    return !this.root ? '' : this._path;
  }

  set method(val) {
    if (!val) {return;}
    val = val.toLowerCase();

    const methods = ['post', 'get', 'put', 'delete', 'patch', 'head'];

    if (methods.indexOf(val) === -1) {
      return;
    }

    this._method = val;
  }

  get method() {
    return this._method;
  }
}

module.exports = Route;
