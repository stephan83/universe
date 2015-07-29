!function(exports) {

  function randomNeuron(n) {
    var weights = [];

    for (var i = 0; i < n; i++) {
      weights.push((Math.random() < 0.5 ? 1 : 0) * (Math.random() < 0.5 ? -1 : 1));
    }

    return {
      bias: (Math.random() < 0.5 ? 1 : 0) * (Math.random() < 0.5 ? -1 : 1),
      weights: weights
    }
  }

  function randomLayer(numInputs, numNeurons) {
    var layer = [];

    for (var i = 0; i < numNeurons; i++) {
      layer.push(randomNeuron(numInputs));
    }

    return layer;
  }

  function One(layers) {
    this._feedback = [0, 0, 0, 0]

    if (layers) {
      this._layers = layers.map(function(layer) {
        return layer.map(function(neuron) {
          return {
            bias: neuron.bias + (Math.random() < 0.2 ? 1 : 0) * (Math.random() < 0.5 ? -1 : 1),
            weights: neuron.weights.map(function(weight) {
              return weight + (Math.random() < 0.2 ? 1 : 0) * (Math.random() < 0.5 ? -1 : 1);
            })
          };
        });
      });
      return;
    }

    this._layers = [
      randomLayer(22, 21)
    ];
  };

  One.prototype.loop = function(sensors) {
    var inputs = [
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0
    ].concat(this._feedback);

    if (sensors.resources) {
      for (var i = 0; i < 8; i++) {
        inputs[i] = Math.min(1, (sensors.resources[i] || 0) / 20);
      }
    }

    if (sensors.players) {
      for (var i = 0; i < 8; i++) {
        inputs[8 + i] = Math.min(1, (sensors.players[i] || 0) / 20);
      }
    }

    inputs[16] = Math.min(1, sensors.resource / 200);
    inputs[17] = Math.min(1, sensors.ammo / 10);

    var outputs = Neurons.sigmoidNetwork(this._layers, inputs);

    var maxValue = 0;
    var maxIndex;

    for (var i = 0; i < 17; i++) {
      var value = outputs[i];

      if (value > maxValue) {
        maxValue = value;
        maxIndex = i;
      }
    }

    this._feedback = outputs.slice(17, 21);

    if (maxIndex < 8) {
      return Universe.moveCommand(maxIndex);
    }

    if (maxIndex < 16) {
      return Universe.fireCommand(maxIndex - 8);
    }
  };

  One.prototype.clone = function() {
    return new One(this._layers);
  };

  exports.One = One;

}(window.Brains || (window.Brains = {}));
