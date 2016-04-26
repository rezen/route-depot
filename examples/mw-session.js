const chromelogger = require('chromelogger');

const name = 'session';

const config = {
  name     : name,
  priority : 999,
  group    : 'session'
};

function handler(conf) {
  return {
    /**
     * Priority for middlware below
     * @type {Number}
     */

    /**
     * Add chrome logger for debugging
     */
    chromeLogger: chromelogger.middleware,

    /**
     * In dev mode we do not need to cache data
     */
    noCache: function(req, res, next) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache'); // HTTP 1.0.
      res.setHeader('Expires', '0'); // Pro
      next();
    }
  }
};

handler.$inject = ['conf'];

module.exports = {name, handler, config};
