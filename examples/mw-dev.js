const chromelogger = require('chromelogger');

const name = 'dev';

const config = {
  name     : name,
  priority : 99,
  group    : 'dev'
};


function test(a) {
  console.log('INJECT');
  return function(req, res, next) {
    console.log('TEST-MW', a);
    next();
  };
}

test.$inject = ['cats'];

function handler(conf) {
  console.log('ALL?', conf);
  return [
    /**
     * Priority for middlware below
     * @type {Number}
     */
    test,
    /**
     * Add chrome logger for debugging
     */
    chromelogger.middleware,

    /**
     * In dev mode we do not need to cache data
     */
    function noCache(req, res, next) {
      console.log('no-cache!');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache'); // HTTP 1.0.
      res.setHeader('Expires', '0'); // Pro
      next();
    }
  ]
};

handler.$inject = ['conf'];

module.exports = {name, handler, config};
