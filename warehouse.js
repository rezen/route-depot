'use strict';

const _s     = require('underscore.string');
const tools  = require('./tools')
const Ware   = require('./ware');

/**
 * @todo sort out path based middleware
 * @todo event emitter
 * @todo prefilter/postfilter?
 */
class Warehouse {

  constructor() {
    this.wares     = [];
    this.nameIndex = {};
    this.groups    = {};
    this.Ware      = Ware;
  }

  /**
   * @param {String|Object} name
   * @param {Function}      handler
   * @param {Object}        config
   */
  add(name, handler, config) {
    if (arguments.length === 1 && typeof name === 'object') {
      let tmp = name;
      name    = tmp.name;
      handler = tmp.handler;
      config  = tmp.config;
    }

    config = config || {};

    name = name || config.name;

    if (typeof name !== 'string') {
      throw new Error('Illegal name for middleware: must have a value');
    }

    if (name.length < 3) {
      throw new Error('Illegal name for middleware: must be at least 3 chars');
    }

    if (!/^[a-z]/.test(name)) {
      throw new Error('Illegal name for middleware: must start with lowercase letter');
    }

    if (typeof config === 'number') {
      config = {priority: config};
    }

    config.name = name;

    const ware = new this.Ware(handler, config);

    if (this.exists(ware)) {
      return this;
    }

    this.addWare(ware);
    return this;
  }

  /**
   * @param  {String|Ware} ware
   * @return {Boolean}
   */
  exists(ware) {
    const label = (typeof ware === 'string') ? ware : ware.name;
    const idx = this.nameIndex[label];
    return (idx !== undefined && this.wares[idx] !== undefined);
  }

  /**
   * @param {Ware} ware
   */
  addWare(ware) {
    if (this.exists(ware)) {
      return ware;
    }

    const order = this.wares.push(ware) - 1;
    this.nameIndex[ware.name] = order;
    ware.order = order;

    if (ware.group) {
      this.join(ware.group, ware);
    }

    return ware;
  }

  /**
   *
   * @param  {String}      group
   * @param  {String|Ware} ware
   */
  join(group, ware) {
    if (!group) {
      throw new Error('You cannot join a group you do not specify');
    }

    if (!this.groups[group]) {
      // @todo sort out groups ... because they can/should have
      // prioritized items as well
      this.groups[group] = [];
    }

    const label = (typeof ware === 'string') ? ware : ware.name;
    const inGroup = (this.groups[group].indexOf(label) !== -1);
    
    if (inGroup) {
      return this;
    }

    this.groups[group].push(label);

    return this;
  }

  /**
   * @param  {String} name
   */
  group(name) {
    if (!this.groups[name]) {
      return [];
    }

    const grouping = this.groups[name].map(id => this.get(id));

    return tools.prioritized(grouping);
  }

  built(name) {
    const ware = (typeof name === 'string') ? this.get(name) : name;
    return ware.operators();
  }

  /**
   * @param  {String} name
   * @return {Ware}
   */
  get(name) {
    const idx = this.nameIndex[name];
    const ware = this.wares[idx];

    return ware; // @todo should we return operators?
  }

  /**
   * @private
   * @param  {Array} wares
   * @return {Array}
   */
  assemble(wares) {
    return tools.prioritized(wares);
  }

  /**
   * @return {Array}
   */
  all() {
    return this.assemble(this.wares);
  }

  /**
   * @todo extract out to plugin
   *
   * @param  {Array} wares
   * @param  {Router} router
   */
  couple(wares, router) {
    wares.map(w => {
      w.map(m => {
        router.use(m)
      });
    });
  }
}

module.exports = Warehouse;
