'use strict';

function depotUrls(depot, logger) {
  logger = logger || console
  depot.all().map(route => {
    const routed = depot.assemble(route);
    const u      = route.url();
    if (typeof u === 'string') {
      logger.info(u);
    } else {

      logger.info(u.endpoint);
      for (const r of u.routes) {
        logger.info('  ' + r);
      }
    }
  });
}

function arrayFlatten(list) {
  var queue       = list.slice(0);
  const flattened = [];

  while (queue.length > 0) {
    const item = queue.shift()
    if (Array.isArray(item)) {
      queue = item.concat(queue);
    } else {
      flattened.push(item)
    }
  }

  return flattened
}

function prioritized(list) {
  return list.slice(0).sort(function(a, b) {
    const x = a.priority;
    const y = b.priority;
    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
  });
}

function randomInt() {
  return ('' + Math.random() * 10000000000).substr(0, 10);
}

module.exports = {depotUrls, arrayFlatten, prioritized, randomInt};
