'use strict';

module.exports = {
  name: 'b',
  before: function(req, res, next) {
    console.log('before-b');
    next();
  },
  getB: function(req, res) {
    console.log('B')
    res.json(this);
  },
  getAllCats : function(req, res) {
    res.json({d: ['fluffy', 'mittens']})
  },
  routes : {
    'GET  /b' : 'getB',
    'GET /cats' : 'getAllCats'
  }
};