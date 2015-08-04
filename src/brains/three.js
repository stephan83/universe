var Decidor = require('../decidor');
var Universe = require('../universe');

function Three(decidor) {
  this._decidor = decidor || new Decidor(38, 17);
  this._prevScore = null;
  this._prevResource = null;
};

Three.prototype.loop = function(sensors) {
  var inputs = new Array(38);
  var j = 0;

  for (var i = 0; i < 8; i++) {
    inputs[j++] = sensors.resources[i] / 25;
  }
  for (i = 0; i < 8; i++) {
    inputs[j++] = sensors.allies[i] / 25;
  }
  for (i = 0; i < 8; i++) {
    inputs[j++] = sensors.enemies[i] / 25;
  }
  for (i = 0; i < 8; i++) {
    inputs[j++] = sensors.missiles[i] / 25;
  }
  for (i = 0; i < 4; i++) {
    inputs[j++] = sensors.walls[i] / 25;
  }

  inputs[j++] = sensors.resource / 100;
  inputs[j++] = sensors.ammo / 10;

  if (this._prevScore !== null) {
    var diff1 = (sensors.score - this._prevScore) / 10;
    var diff2 = (sensors.resource - this._prevResource) / 10;
  }

  this._prevScore = sensors.score;
  this._prevResource = sensors.resource;

  var output = this._decidor.process(inputs, diff1 + diff2);

  // Output 0-7 => Move

  if (output < 8) {
    return Universe.moveCommand(output);
  }

  // Output 8 -16 => Move

  if (output < 16) {
    return Universe.fireCommand(output - 8);
  }

  // If max index is 17, do nothing
};

Three.prototype.mutate = function() {
  return new Three(this._decidor.clone());
};

Three.prototype.mate = function(partner) {
  return new Three();
};

module.exports = Three;
