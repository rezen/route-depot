'use strict';

class HttpDevice {

  constructor(b) {
    this.b = b;
  }

  wrap(conn, next, route, handle) {
    next();
  }

  getIndex(request, reply) {
    reply({d: this.b});
  }

  getRequestKey(request, reply) {
    reply({d: 'b'});
  }

  postRequestKey(request, reply) {
    reply({d: 'b'});
  }

  getRequestStatus(request, reply) {
    reply(req.params);
  }

  getA(request, reply, next) {
    next();
  }
}

HttpDevice.routes = {
  'GET  /'     : 'getIndex',
  'GET  /api/device' : 'getRequestKey',
  'POST /api/device' : 'postRequestKey',
  'GET  /api/device/{deviceId}' : 'getRequestStatus',
};

module.exports = HttpDevice;
