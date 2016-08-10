'use strict';

const url        = require('url');
const async      = require('async');
const tools      = require('./tools');
const namer      = require('./tools/namer');
const Priorities = require('./priorities');
const fnStack    = require('./mixins/fn-stack');

class Route {
  /**
   * We need at least a request and handler to have a route
   *
   * new Route('/disco', 'GET', function() {});
   *
   * new Route('GET /dance', null, function(req, res) {
   *   res.send('dance-party!');
   * });
   *
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
    var name  = null;
    var order = null;

    if (handler) {
      name   = handler.$name  || handler.name;
      order  = handler.$order || handler.order;
      config = config || handler.config;
    }

    config = this.toConfig(config || {});

    this._method  = null;
    this._path    = null;
    this.request  = this.intakeRequest(request);
    this.method   = method;
    this.config   = config;
    this.handlers = [];
    this.priority = config.priority || Priorities.DEFAULT;
    this.name     = config.name || name;
    this.root     = config.root || false;
    this.order    = config.order || order;
    this.wrappers = config.wrappers;
    this.addHandler(handler, context || config.binding);
  }

  toConfig(config) {
    config = config || {root: false, binding: null};

    if (typeof config === 'number') {
      config = {priority: config};
    }

    if (!config.priority) {
      config.priority = Priorities.DEFAULT;
    }  else if (typeof config.priority === 'string') {
      config.priority = Priorities[config.priority] || Priorities.DEFAULT;
    }

    if (!config.wrappers) {
      config.wrappers = [];
    }

    return config;
  }

  /**
   * Take a request string and parse path and
   * possibly the http method
   *
   * @private
   * @param  {String} request
   */
  intakeRequest(request) {
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
   * @private
   * @param {Mixed} handle
   * @param {Mixed} context
   */
  addHandler(handle, context) {
    if (typeof handle === 'string') {
      this.config.handle = handle;
    }

    if (handle) {
      this.handlers.push(handle);
    }

    this.context = context;
    return this;
  }

  /**
   * Get all the built handlers
   *
   * @return {Array}
   */
  tracks() {
    const handles = [].concat.apply([], this.handlers); // flatten if nested arrays
    return handles.map(h => this.assemble(h));
  }

  /**
   * Take a handle and bind it with the appropriate context
   * and wrap it in any route wrappers that may exist.
   *
   * @param  {Mixed} handle
   * @return {Function}
   */
  assemble(handle, wraps) {
    wraps = wraps || this.wrappers;

    const self     = this;
    const fn       = this.bindHandle(handle);
    const wrappers = this.collectWrappers(wraps); // combine global + local

    if (wrappers.length === 0) {
      return fn;
    }

    // Handles request
    function onRequest(req, res, next) {
      /**
       *  Pass the handler with the request injected
       *  so that route handlers can call the handle
       */
      fn.$call = function() {
        return fn(req, res, next);
      };

      // The wraps may want to know the origin name
      fn.$call.$meta = {
        name: fn.$handle
      };

      // Request params passed
      const conn = {req, res, next};

      function onWrap(wrap_, callback) {
        wrap_(conn, callback, self, fn.$call);
      }

      function onWrapped(err) {
        fn.$call();
      }

      /**
       * connect based http routers middlware have no idea of what the
       * next request is. Adding wrappers to routes allows us to add
       * intercept calls to the route and apply logic like acls with
       * information about the route
       */
      async.eachSeries(wrappers, onWrap, onWrapped);
    }

    onRequest.$handle = fn.$handle;

    return onRequest;
  }

  /**
   * If the handle has a context, bind the handle to the context.
   * If handle is string, gets function from context
   *
   * @private
   * @param  {Mixed}    handle
   * @return {Function}
   */
  bindHandle(handle) {
    var fn = handle;
    var name = handle ? handle.name || '' : '';

    if (!name || name === '') {
      name = ''.concat('h_', tools.randomInt());
    }

    if (!this.context) {
      fn.$bound = false;
      fn.$handle = name;
      return fn;
    }

    let ctx = this.context;

    if (typeof handle === 'string') {
      name = handle;

      if (!ctx[handle]) {
        let name = ctx.name || ctx.constructor.name;
        throw new Error('Route context is missing configured action - ' + name + '.' + handle);
      }

      handle = ctx[handle];
    }

    fn = handle.bind(ctx);
    fn.$bound = true;
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

fnStack(Route, 'wrapper');

module.exports = Route;
