'use strict';

const sinon      = require('sinon');
const assert     = require('assert');
const Ware       = require('../ware');
const Warehouse  = require('../warehouse');
const Priorities = require('../priorities');


describe('Warehouse', () => {
  var house;

  const resetHouse = () => { 
    house = new Warehouse(); 
  };

  beforeEach(() => resetHouse());

  describe('#Warehouse', function() {
    it('Should have specific class properties', () => {
     
    });
  });

  describe('#constructor',  () => {
    it('Should have specific instance properties set', () => {
      assert(Array.isArray(house.wares));
      assert.equal(house.wares.length, 0);
      assert.deepEqual(house.nameIndex, {});
      assert.deepEqual(house.groups, {});
    });
  });

  describe('#add', () => {
    const ware = {
      name    : 'bob', 
      handler : function bob2() {}, 
      config  : {}
    };

    it('Add to the wares attribute and add index', () => {
      house.add(ware);
      assert.equal(house.wares.length, 1);
      assert.deepEqual(house.nameIndex, {bob: 0});
      assert.deepEqual(house.groups, {});
    });

    it('Should not add the ware again', () => {
      house.add(ware);
      house.add(ware);
      house.add(ware);
      assert.equal(house.wares.length, 1);
    });

    it('Should accept multiple argument patterns and net with the same ware', () => {
      house.add(ware.name, ware.handler);
      var a = house.wares[0];
      assert.equal(house.wares.length, 1);
      resetHouse();
      assert.equal(house.wares.length, 0); // validate reset
      house.add(ware);
      var b = house.wares[0];
      assert.equal(house.wares.length, 1);
      assert.deepEqual(a, b);
    });

    it('Should have expectations with the name of the ware', () => {
      assert.throws(() => {
        house.add('');
      });
    });
  });

  describe('#exists', () => {
    it('Should return false for non-existant', () => {
      assert.equal(house.exists('jets'), false);
    });

    it('Should return true for existant', () => {
      house.wares.push({});
      house.nameIndex['jets'] = 0;
      assert(house.exists('jets'));
    });

    it('If index and wares do not both exist will return false', () => {
      house.nameIndex['jets'] = 0;
      assert.equal(house.exists('jets'), false);
    });
  });

  describe('#addWare', () => {
   
  });

  describe('#join', () => {

    it('Add the group if it does not exists', () => {
      house.join('cats', 'dogs');
      assert.deepEqual(house.groups, {cats: ['dogs']});
      house.join('cats', 'dogs');
    });

    it('Wont add to the group twice', () => {
      house.join('bees', 'dogs');
      house.join('bees', 'dogs');

      assert.deepEqual(house.groups, {bees: ['dogs']});
    });

    it('Can join with ware object if the name is set', () => {
      house.join('bees', {name: 'bizz'});
      assert.deepEqual(house.groups, {bees: ['bizz']});
    });
  });

  describe('#group', () => {
    it('If you grab an empty group you will receive an empty array', () => {
      const group = house.group();
      assert.equal(group.length, 0);
    });

    it('Will receive the members of the group', () => {      
      house.wares.push({name: 'dogs'});
      house.nameIndex['dogs'] = 0;
      house.wares.push({name: 'cats'});
      house.nameIndex['cats'] = 1;
      house.join('bees', 'dogs');
      const group1 = house.group('bees');
      assert.equal(group1.length, 1);
      house.join('bees', 'cats');
      const group2 = house.group('bees');
      assert.equal(group2.length, 2);
    });
  });

  describe('#get', () => {
    it('Will give you undefined for non-existant ware', () => {
      assert.equal(house.get('dogs'), undefined)
    });

    it('Will get the ware of the name', () => {
      const stub = sinon.stub();
      const dogs = {name: 'dogs', operators: stub};
      house.wares.push(dogs);
      house.nameIndex['dogs'] = 0;

      const ware = house.get('dogs');
      assert.equal(ware, dogs);
    });
  });

  describe('#assemble', () => {
   
  });

  describe('#all', () => {
   
  });
});
