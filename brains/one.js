!function(exports) {

  function randomNeuron(n) {
    var weights = [];

    for (var i = 0; i < n; i++) {
      weights.push(-1 + Math.random() * 2);
    }

    return {
      bias: Math.random(),
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

  function One(parent) {
    this._prevOutputs = [
      0.5, 0.5, 0.5, 0.5,
      0.5, 0.5, 0.5, 0.5,
      0.5, 0.5, 0.5, 0.5,
      0.5, 0.5, 0.5, 0.5,
      0.5
    ];

    if (!parent) {
      this._layers = [
        //randomLayer(39, 39),
        //randomLayer(39, 39),
        //randomLayer(39, 39),
        //randomLayer(39, 39),
        //randomLayer(39, 39),
        randomLayer(39, 17),
        //randomLayer(17, 17)
      ];
      return;
    }

    this._layers = [];

    for (var i = 0; i < parent._layers.length; i++) {
      var layer = parent._layers[i];
      this._layers[i] = [];
      for (var j = 0; j < layer.length; j++) {
        var neuron = layer[j];
        this._layers[i][j] = {
          bias: (neuron.bias + (-0.1 + Math.random() * 0.2)) * (Math.random() < 0.1 ? - 1 : 1),
          weights: neuron.weights.map(function(w) {
            return (w + (-0.1 + Math.random() * 0.2)) * (Math.random() < 0.1 ? - 1 : 1)
          })
        }
      }
    }

  };

  One.prototype.loop = function(sensors) {

    var inputs = this._prevOutputs.concat([
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0]);

    inputs[17] = sensors.resource / 100;
    inputs[18] = sensors.ammo / 10;

    if (sensors.players) {
      for (var i = 0; i < sensors.players.length; i++) {
        inputs[19 + i] = Math.max(1, (sensors.players[i] || 0) / 10);
      }
    }

    if (sensors.resources) {
      for (i = 0; i < sensors.resources.length; i++) {
        inputs[27 + i] = Math.max(1, (sensors.resources[i] || 0) / 10);
      }
    }

    if (sensors.walls) {
      for (i = 0; i < sensors.walls.length; i++) {
        inputs[35 + i] = Math.max(1, (sensors.walls[i] || 0) / 10);
      }
    }

    var outputs = Neurons.sigmoidNetwork(this._layers, inputs);

    var maxValue = 0;
    var maxIndex;

    for (var i = 0; i < outputs.length; i++) {
      var value = outputs[i];

      if (value > maxValue) {
        maxValue = value;
        maxIndex = i;
      }
    }

    this._prevOutputs = outputs;

    if (maxIndex < 8) {
      return Universe.fireCommand(maxIndex);
    }

    if (maxIndex < 16) {
      return Universe.moveCommand(maxIndex - 8);
    }
  };

  One.prototype.clone = function() {
    return new One(this);
  };

  exports.One = One;

}(window.Brains || (window.Brains = {}));
