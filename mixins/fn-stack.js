'use strict';

const _s         = require('underscore.string');
const tools      = require('../tools');
const Priorities = require('../priorities');


// @todo mixin manager
// {label, static: {}, instance: {}}
module.exports = function(Cls, attr) {

  const label      = 'fn-stack-' + attr;
  const plural     = ''.concat(attr + 's');
  const classified = _s.classify(attr);
  const adder      = ''.concat('add', classified);
  const collect     = ''.concat('collect', classified, 's');

  if (!Cls.$mixins) {
    Cls.$mixins = [];
  }

  if (Cls.$mixins.indexOf(label) !== -1) {
    return Cls;
  }

  Cls[plural] = [];

  // @todo decide Array or Set
  Cls[adder] = function(filter_, priority) {
    priority = priority || Priorities.DEFAULT;

    if (!filter_.priority) {
      filter_.priority = priority;
    }

    filter_.order = Cls[plural].push(filter_) - 1;
  };

  Cls.prototype[adder] = function(filter_, priority) {

    if (!this[plural]) {
      this[plural] = [];
    }

    priority = priority || Priorities.DEFAULT;

    if (!filter_.priority) {
      filter_.priority = priority;
    }

    filter_.order = this[plural].push(filter_) - 1;
  };
  
  Cls.prototype[collect] = function(filters_) {
    filters_ = filters_ || this[plural];
    if (!filters_) {
      filters_ = [];
    }

    if (filters_ instanceof Set) {
      filters_ = Array.from(filters_);
    } else if (!Array.isArray(filters_)) {
      filters_ = [filters_];
    }
  
    // @todo should be sorted?
    return tools.arrayFlatten(Array.from(new Set(
      (this.constructor[plural] || []).concat(filters_)
    )));
  }

  Cls.$mixins.push(label);

  return Cls;
};
