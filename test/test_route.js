'use strict';

const sinon      = require('sinon');
const assert     = require('assert');
const Route      = require('../route');
const Priorities = require('../priorities');


describe('Route', () => {
    var route;
    var configs = {
        a: {name: 'A'},
        b: {name: 'B', priority: 2},
    };

    before(() => {
        route = new Route('/disco', 'GET', () => {}, null, configs.a);
    });

    describe('#constructor', () => {
        it('Should parse the method', () => {
            assert.equal(route.method, 'get');
        });

        it('Should pick up the config', () => {
            assert.equal(route.config, configs.a);
        });

        it('Should determine endpoint', () => {
            assert.equal(route.endpoint, '/disco');
        });

        it('Should name route', () => {
            assert.equal(route.name, configs.a.name);
        });

        it('Should have a priority', () => {
            assert.equal(route.priority, Priorities.DEFAULT);
        });

        it('Should have a root', () => {
            assert.equal(route.root, false);
        });
    });

    describe('#url', () => {
        it('Should return the full path of the url', () => {
            assert.equal(route.url(), '/disco');
        });
    });

    describe('#intakeRequest', () => {
        var data;
        var parser;
        before(() => {
            data = {};
            parser = route.intakeRequest.bind(data);
        });

        it('Parse a request', () => {
            const req = 'GET /dance';
            parser(req);
            assert.equal(data._request, req);
            assert.equal(data.method, 'GET');
            assert.equal(data.path, '/dance');
        });

        it('Cannot parse invalid http methods', () => {
            const route_ = new Route('/disco')
            route_.intakeRequest('Z /lo');
            assert.equal(route_.method, null);
        });

        it('Explicit http methods over-ride parsed ones', () => {
            const route_ = new Route('POST /disco', 'GET')
            assert.equal(route_.method, 'get');
        });
    });

    describe('#assemble', () => {

       it('Build the route handle', () => {
            function xhandle(req, res, next) {}
            const h = route.assemble(xhandle);
            assert.equal(h.$bound, false);
            assert.equal(h.$handle, 'xhandle');
       });

       it('Build the handle with bindings', () => {
            function yhandle(req, res, next) {
                return this.im;
            }
            route.context = {im: 'this'};
            const h = route.assemble(yhandle);
            assert.equal(h.$bound, true);
            assert.equal(h.$handle, 'yhandle');
            assert.equal(h(), 'this');
       });

       it('Build the handle with bindings and wrappers', function(done) {
            const label = 'zhandle';
            function assertArgs(conn, next, route_, handle) {
                assert.deepEqual(conn,  {req: 'a', res: 'b', next: 'c' })
                assert.equal(route_, route);
                assert.equal(handle.$meta.name, label);
                assert.equal(typeof next, 'function');
            }

            function wrap1(conn, next, route_, handle) {
                assertArgs(conn, next, route_, handle);
                next();
            }

            function wrap2(conn, next, route_, handle) {
                assertArgs(conn, next, route_, handle);
                next();
            }

            function zhandle(req, res, next) {
                // validate dummy res came through
                assert.equal(res, 'b');
                // is this same as route context?
                assert.equal(this, route.context);
                // validate value on this
                assert.equal(this.hey, 'oh'); 
                spies.handle();
                return this.hey;
            }

            const spies = {
                handle: sinon.spy(),
                w1: sinon.spy(wrap1),
                w2: sinon.spy(wrap2),
            };
            
            route.context = {hey: 'oh'};
            route.wrappers = [spies.w1, spies.w2];

            const h = route.assemble(zhandle);
            assert.equal(h.$handle, label);
            const res = h('a', 'b', 'c');

            setTimeout(function () { 
                assert(spies.handle.called);
                assert(spies.w1.called);
                assert(spies.w2.called);
                done();
            }, 10);
       });
    });
});
