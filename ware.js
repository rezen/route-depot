'use strict';

const Priorities = require('./priorities');
const fnStack    = require('./mixins/fn-stack');

class Ware {

  /**
   * @param  {Array|Function|Object} handlers
   * @param  {Object} config
   */
  constructor(handlers, config) {
    config = this.toConfig(config);

    if (!Array.isArray(handlers)) {
      handlers = [handlers];
    }

    this.handlers = handlers || [];
    this.label    = config.name;
    this.priority = config.priority
    this.config   = config;
    this.builders = config.builders || [];
    this.nested   = new Set();
  }

  /**
   * @param  {Object|Number} config
   * @return {Object}
   */
  toConfig(config) {
    config = config || {group: false};

    if (typeof config === 'number') {
      config = {priority: config};
    }

    if (!config.priority) {
      config.priority = Priorities.DEFAULT;
    } else if (typeof config.priority === 'string') {
      config.priority = Priorities[config.priority] || Priorities.DEFAULT;
    }

    if (!config.builders) {
      config.builders = [];
    }

    return config;
  }

  /**
   * @return {Array}
   */
  operators() {
    const handles = this.handlers.map(
      h => this.assemble(h, this.builders)
    );

    return [].concat.apply([], handles).map(built => {
      if (typeof built !== 'function') {
        throw new Error('Useless built handler, needs a function not: ' + typeof built);
      }

      return built;
    });
  }

  /**
   * @param  {Mixed} handle
   * @param  {Array} builders
   * @return {Mixed}
   */
  assemble(handle, builders) {
    builders = builders || this.builders;
    const makers = this.collectBuilders(builders);

    return makers.reduce((handle_, make) => {
      return make(handle_, this);
    }, handle);
  }

  /**
   * @return {Mixed}
   */
  get group() {
    return this.config.group || false;
  }

  /**
   * @return {String}
   */
  get name() {
    // @todo camelize
    return this.config.name  || this.handler.name;
  }
}

/**
 * Add a to class and prototype functions for
 * adding to a function stack which is used for
 * building up middleware handlers
 */
fnStack(Ware, 'builder');

/**
 * Default builder that allows dictionaries of objects
 * to be assembled into array of handlers
 */
Ware.addBuilder(function(handle, ware) {
  if (handle.priority) {
    ware.priority = handle.priority;
    delete handle.priority;
  }

  if (Array.isArray(handle)) {
    const handles = [];
    for (const fn of handle) {
      handles.push(ware.assemble(fn));
      ware.nested.add(fn.name);
    }
    return handles;
  }

  if (typeof handle === 'object') {
    const handles = [];
    for (const name in handle) {
      handles.push(ware.assemble(handle[name]));
      ware.nested.add(name);
    }
    return handles;
  }

  // Associate handler name with ware
  if (handle.name && handle.name !== 'handler') {
    ware.nested.add(handle.name);
  }

  return handle;
}, Priorities.HIGH);

module.exports = Ware;
