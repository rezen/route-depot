'use strict';

const name = 'auth';

const config = {name};

function handler(auth) {
  console.log('build-auth');
  return function (req, res, next) {
    console.log('authd', auth);
    next();
  };
}

// handler.$inject = ['auth'];

module.exports = {name, handler, config};
