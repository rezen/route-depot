'use strict';

const _s = require('underscore.string');

module.exports = {
  routeNameByUrl : function(route) {
    var parts = [];
    const ignore = ['', 'http'];

    if (route.context) {
      const Ctrl = route.context;
      parts = _s.underscored(Ctrl.name || (Ctrl.constructor.name || '')).split('_');
    }

    parts = parts
      .concat(route.path.split('/'))
      .map(p => p.replace(/\:/g, ''))
      .filter(p => ignore.indexOf(p) === -1);

    if (route.path === '/') {
      parts.push('index');
    }

    return parts.join('.');
  },

  routeNameByHandlers: function(route) {
    var parts = [];
    var prefix = '';
    var fn = route.handlers[route.handlers.length - 1];
    var suffix = '';

    if (typeof fn === 'string') {
      suffix = fn;
    }  else {
      suffix = fn.name;
    }

    if (route.context) {
      const Ctrl = route.context;
      prefix = Ctrl.name || (Ctrl.constructor.name || '');
      prefix = prefix + '.';
    }

    parts = _s.dasherize(prefix + suffix);
    return parts.slice(0, parts.length);
  }
};
