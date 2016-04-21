'use strict';

const _s = require('underscore.string');

/**
 * Set up $routes maps for a controller without having 
 * to explicity set endpoints
 */
function keyRoute(parts, joiner) {
  joiner = joiner || '-';
  var tmp = parts.slice(0);
  const verb = tmp.shift().toLowerCase();

  if (tmp.length === 1 && tmp[0] === 'index') {
    tmp = [];
  }

  return verb.toUpperCase() + ' /' + tmp.filter(s => s.trim() !== '').join(joiner);
}

module.exports.keyRoute = keyRoute;

function resource(obj, resourceName) {
  const name  = _s.decapitalize(resourceName || obj.name)
                  .split('/')
                  .filter(p => p !== '')
                  .pop();

  var inspect = obj;

  if (typeof obj === 'function'){
    inspect = obj.prototype;
  }

  const setup = function(inspect) {
    const routes = {};
    const props = Object.getOwnPropertyNames(inspect);
    const idPattern = ':' + _s.camelize(name, true) + 'Id';
    const actions = {
      index:   ['get'],
      create:  ['get','create'],
      store:   ['post'],
      show:    ['get', idPattern], 
      edit:    ['get', idPattern, 'edit'] , 
      update:  ['put', idPattern], 
      destroy: ['delete', idPattern],
    };

    for (const attr of props) {

      if (!actions[attr]) {
        continue;
      }

      if (!Array.isArray(actions[attr])) {
        continue;
      }

      const key = keyRoute(actions[attr], '/');

      routes[key] = attr;
    }

    return routes;
  }

  return setup(inspect);
};

module.exports.resource = resource;

function implicit(obj) {
  var inspect = obj;

  if (typeof obj === 'function'){
    inspect = obj.prototype;
  }

  const setup = function(inspect) {
    const routes = {};
    const props = Object.getOwnPropertyNames(inspect);

    for (const attr of props) {
      let parts = _s.dasherize(attr).split('-');

      if (parts.length < 2) {
        continue;
      }

      const key = keyRoute(parts);

      routes[key] = attr;
    }

    return routes;
  }

  setup(inspect, obj);
};

module.exports.implicit = implicit;
