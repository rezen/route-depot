'use strict';

class HttpDevice {

  constructor(b) {
    this.b = b;
  }

  before(req, res, next) {
    console.log('BEFORE DEVICE', req.method);
    next();
  }

  wrap(conn, next, route, handle) {
    console.log('in-http-dev', handle.$meta);
    next();
    //next();
    // next();
    // console.log('wrappa', handle.$call);
    //handle(req, res, next);
    // return conn.res.json({d: 'wrapped'});
  }

  getIndex(req, res) {
    res.json({d: this.b});
  }

  getRequestKey(req, res) {
    res.json({d: 'b'});
  }

  postRequestKey(req, res) {
    res.json({d: 'b'});
  }

  getRequestStatus(req, res) {

    res.json(req.params);
  }

  getA(req, res, next) {
    next();
  }

  middleware() {
    return ['acl']
  }
}

HttpDevice.routes = {
  'GET  /'     : 'getIndex',
  'GET  /api/device' : 'getRequestKey',
  'POST /api/device' : 'postRequestKey',
  'GET  /api/device/:deviceId' : 'getRequestStatus'

};

HttpDevice.$policy = {
  '*': ['auth'],
  postRequestKey : 'acl:manage.device'
};

module.exports = HttpDevice;