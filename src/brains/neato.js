var Neat = require('../neat');
var Universe = require('../universe');

function Neato(network) {
  this._network = network || new Neat(42, 21).mutate();
  this._inputs = new Float32Array([
    0, 0, 0, 0, 0, 0, 0, 0, // Resources sensors
    0, 0, 0, 0, 0, 0, 0, 0, // Allies sensors
    0, 0, 0, 0, 0, 0, 0, 0, // Enemies sensors
    0, 0, 0, 0, 0, 0, 0, 0, // Missiles sensors
    0, 0, 0, 0,             // Wall sensors
    0,                      // Resource
    0,                      // Ammo
    0, 0, 0, 0              // Feeback
  ]);
};

Neato.prototype.loop = function(sensors) {
  var inputs = this._inputs;
  var j = 0;

  // Fill sensor inputs
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

  // Feed inputs to neural network

  var outputs = this._network.process(inputs);

  // Save output feedback for next loop

  for (i = outputs.length - 4; i < outputs.length; i++) {
    inputs[j++] = outputs[i];
  }

  // Find highest non feedback output

  var maxValue = 0;
  var maxIndex;

  for (var i = 0; i < 17; i++) {
    var value = outputs[i];

    if (value > maxValue) {
      maxValue = value;
      maxIndex = i;
    }
  }

  // Output 0-7 => Move

  if (maxIndex < 8) {
    return Universe.moveCommand(maxIndex);
  }

  // Output 8 -16 => Move

  if (maxIndex < 16) {
    return Universe.fireCommand(maxIndex - 8);
  }

  // If max index is 17, do nothing
};

Neato.prototype.mutate = function() {
  return new Neato(this._network.mutate());
};

Neato.prototype.mate = function(partner) {
  // TODO crossover
  return new Neato(this._network.mutate());
};

Neato.prototype.toGraph = function() {
  return this._network.toGraph();
};

module.exports = Neato;
