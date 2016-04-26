'use strict';

const name = 'auth';

const config = {name};

function handler(auth) {

    return function (req, res, next) {
        if (!req.headers['x-otp']) {
            return next();
        }

        auth.authenticate('pam', {session: false}, function(err, user) {
            if (err) { return next(err); }

            req.logIn(user, function(err_) {
                req.user = new User(user);
                next(err_);
            });
        })(req, res, next);
    };
}

handler.$inject = ['auth'];

module.exports = {name, handler, config};
