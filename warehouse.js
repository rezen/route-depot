'use strict';

const _s     = require('underscore.string');
const tools  = require('./tools')
const Ware   = require('./ware');

/**
 * Keep all your middlewares safe in one place!
 * 
 * @todo sort out path based middleware
 * @todo event emitter
 * @todo prefilter/postfilter?
 *
 * Currently groups are somewhat dumb and adding
 * to existing groups is much too raw without 
 * properly prioritizing etc.
 */
class Warehouse {

  constructor() {
    this.wares     = [];
    this.nameIndex = {};
    this.groups    = {};
    this.welded    = {};
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
    const ware = new this.Ware(handler, null, config);

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
      // @todo needs improvement
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
    var args = Array.prototype.slice.call(arguments, 1);

    if (args.length === 1) {
      [name, args] = this.parseNameWithArgs(name);
    }

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
   * We return a copy of the ware because we do not 
   * want the properties of the original to be 
   * manipulated
   *
   * @param  {String} name
   * @return {Ware}
   */
  get(name) {
    var args = Array.prototype.slice.call(arguments, 1);

    if (args.length === 0) {
      [name, args] = this.parseNameWithArgs(name);
    }

    const idx  = this.nameIndex[name];
    const ware = this.wares[idx];

    if (!ware) {
      return ware;
    }

    const cloned = this.cloneWare(ware);

    cloned.args = cloned.args.concat(args);

    return cloned;
  }

  find(name) {
    const ware = this.get(name);

    if (ware) {
      return ware;
    }

    return this.group(name);
  }

  /**
   * 
   * @param  {String} name
   * @param  {} middlewares
   */
  weld(name, wares) {
    if (arguments.length > 2) {
      wares = Array.prototype.slice.call(arguments, 1);
    }

    if (!Array.isArray(wares)) {
      throw new Error('The {wares} argument is not a valid configuration');
    }

    if (!this.groups[name]) {
      this.groups[name] = wares;
    }
    
    this.welded[name] = wares;

    return wares.map(id => this.find(id)).filter(w => w !== undefined && w.length !== 0);
  }

  cloneWare(ware) {
    return new this.Ware(
      ware.handlers || [],
      null,
      ware.config
    );
  }

  parseNameWithArgs(name) {
    const parts = name.split(':');

    if (parts.length === 1) {
      return [name, []];
    }
    name = parts.shift();

    // @todo ?
    // if (parts[0].charAt(0) === '{')

    const args = parts[0].split(',');

    return [name, args];
  }

  /**
   * @private
   * @param  {Array} wares
   * @return {Array}
   */
  assemble(wares) {
    if (!wares) {
      throw new Error('You cannot assemble without {wares}');
    }

    if (!Array.isArray(wares)) {
      wares = [wares.operators()];
    }

    // @todo flatten results?
    const assembled = tools.prioritized(wares).map(w => {
      if (Array.isArray(w)) { return this.assemble(w); }

      return w.operators();
    });

    return tools.arrayFlatten(assembled);
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
    if (!wares) {
      throw new Error('There are no {wares} to couple to the {router}');
    }

    this.assemble(wares).map(w => {
      router.use(w);
    });
  }
}

module.exports = Warehouse;
