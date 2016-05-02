'use strict';

const express   = require('express');
const Warehouse = require('../warehouse');
const mwDev     = require('./mw-dev');
const mwAuth    = require('./mw-auth');

const warehouse = new Warehouse();

warehouse.Ware.addBuilder(function(handle, ware) {
  if (!handle.$inject) {
    return handle;
  }

  return ware.assemble(handle('CONF-yo'));
});

warehouse.add(mwDev)
warehouse.add(mwAuth);
warehouse.add(mwDev);

const app    = express();
const router = express.Router();

app.get('/', function(req, res) {
  console.log('YAY');
  res.send('yay');
});


warehouse.couple(warehouse.get('auth'), router);
warehouse.couple(warehouse.group('dev'), router);

router.get('/lol', function(req, res) {
  console.log('plz?')
  res.send('Birds home page');
});

app.use('/', router);

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

