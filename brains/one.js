!function(exports) {

  function One(network) {
    this._network = network || new FeedForward([42, 42, 32, 21]);
    this._feedback = [0, 0, 0, 0];
  };

  One.prototype.loop = function(sensors) {
    var inputs = [
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0
    ].concat(this._feedback);

    for (var i = 0; i < 8; i++) {
      inputs[i] = sensors.resources[i] / 25;
    }

    for (i = 0; i < 8; i++) {
      inputs[8 + i] = sensors.allies[i] / 25;
    }

    for (i = 0; i < 8; i++) {
      inputs[16 + i] = sensors.enemies[i] / 25;
    }

    for (i = 0; i < 8; i++) {
      inputs[24 + i] = sensors.missiles[i] / 25;
    }

    for (i = 0; i < 4; i++) {
      inputs[32 + i] = sensors.walls[i] / 25;
    }

    inputs[36] = sensors.resource / 100;
    inputs[37] = sensors.ammo / 10;

    var outputs = this._network.process(inputs);

    var maxValue = 0;
    var maxIndex;

    for (var i = 0; i < 17; i++) {
      var value = outputs[i];

      if (value > maxValue) {
        maxValue = value;
        maxIndex = i;
      }
    }

    this._feedback = outputs.slice(17);

    if (maxIndex < 8) {
      return Universe.moveCommand(maxIndex);
    }

    if (maxIndex < 16) {
      return Universe.fireCommand(maxIndex - 8);
    }
  };

  One.prototype.mutate = function() {
    return new One(this._network.mutate());
  };

  One.mate = function(a, b) {
    return new One(FeedForward.mate(a._network, b._network));
  };

  exports.One = One;

}(window.Brains || (window.Brains = {}));
