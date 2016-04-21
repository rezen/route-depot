'use strict';

/**
 * These functions are used to attach to the appropriate
 * http interface
 * 
 * @type {Object}
 */
module.exports = {

  plugins: {},

  depot: function(server) {
    return this.getAll().reduce((http_, route) => {
      route = this.preAttach(route);
      route.couple(http_);
      return http_;
    }, server);
  },


  route: function(server) {
    server.route({
      method:  this.method.toUpperCase(),
      path:    this.url(),
      handler: this.getHandlers()[0]
    });

    return server;
  },

  group: function(server) {
    return this.getAll().reduce((srv, route) => {
      return route.couple(srv);
    }, server);
  }
};
