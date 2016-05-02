'use strict';

const sinon      = require('sinon');
const assert     = require('assert');
const Ware       = require('../ware');
const Priorities = require('../priorities');


describe('Ware', () => {
  var ware1;
  var spy1;
  var configs = {
    a: {name: 'A'},
    b: {name: 'B', priority: 2},
  };

  before(() => {
    spy1 = sinon.spy();
    ware1 = new Ware(spy1, null, configs.b);
  });

  describe('#Ware', () => {
    it('Should have specific class properties', () => {
      assert(Array.isArray(Ware.builders));
      assert.equal(typeof Ware.addBuilder, 'function');
      assert.equal(Ware.builders.length, 1);
    });
  });

  describe('#constructor', () => {
    it('Should have specific instance properties set', () => {
      assert(Array.isArray(ware1.builders));
      assert(Array.isArray(ware1.handlers));
      assert.equal(ware1.handlers.length, 1);
      assert.equal(ware1.label, configs.b.name);
      assert.equal(ware1.priority, configs.b.priority);
      assert.equal(ware1.config, configs.b);
      assert.equal(typeof ware1.addBuilder, 'function');
      assert.equal(typeof ware1.collectBuilders, 'function');
    });
  });

  describe('#toConfig', () => {

    it('Accept an undefined config and provide a default', () => {
      const conf = ware1.toConfig();
      assert.deepEqual(conf, {group: false, priority: 999, builders: []});
    });

    it('Accept an integer and convert to priority', () => {
      const conf = ware1.toConfig(12);
      assert.deepEqual(conf, {priority: 12,  builders: []});
    });

    it('Will accept priority config as a string and fetch off Priorities object', () => {
      const conf = ware1.toConfig({priority: 'HIGH'});
      assert.deepEqual(conf, {priority: 100,  builders: []});
    });
  });

  describe('#clone', () => {
    it('Create a copy of itself', () => {
      const clone = ware1.clone();
      assert.deepEqual(clone, ware1);
      assert(clone !== ware1);
    });
  });

  describe('#operators', () => {
    var ware2;
    var spies;
    before(() => {
      spies = {
        a: sinon.spy(),
        b: sinon.spy()
      };

      ware2 = new Ware(spies);
      sinon.spy(ware2, 'collectBuilders');
    });

    it('Should return an array', () => {
      const operators = ware1.operators();
      assert(Array.isArray(operators));
      assert.equal(operators[0], spy1);
   });

    it('Should call @collectBuilders', () => {
      const operators = ware2.operators();
      
      // Calls once for the parent and once for each child
      assert.equal(ware2.collectBuilders.callCount, 3);
    });

    it('Should return the correct number of operators', () => {
      const operators = ware2.operators();
      assert.equal(operators.length, 2);
      assert.deepEqual(Array.from(ware2.nested), ['proxy', 'a', 'b']);
    });

    it('Should throw an error with a bad builder', () => {
      ware2.addBuilder(() => {return false;});
      assert.throws(() => {
        ware3.operators()
      });
    });
  });

  describe('#addBuilder', () => {
    var ware3;
    var builder;
    before(() => {
      builder = sinon.stub();
      ware3 = new Ware(function dance(){});
      ware3.addBuilder(builder);
    });

    it('Should add to list called from @collectBuilders', () => {
      const builders = ware3.collectBuilders();
      assert.equal(builders[1], builder);
    });

    it('Should be called when running @operators', () => {
      assert.throws(() => {
        ware3.operators()
      });
      assert.equal(builder.callCount, 1);
    });
  });
});
