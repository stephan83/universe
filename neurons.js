!function(exports) {

  var Neurons = {

    sigmoid: function(bias, weights, inputs) {
      var sum = bias;

      for (var i = 0; i < inputs.length; i++) {
        sum += weights[i] * inputs[i];
      }

      return 1 / (1 + Math.exp(-sum));
    },

    softplus: function(bias, weights, inputs) {
      var sum = bias;

      for (var i = 0; i < inputs.length; i++) {
        sum += weights[i] * inputs[i];
      }

      return Math.log(1 + Math.exp(sum));
    },

    hardmax: function(bias, weights, inputs) {
      var sum = bias;

      for (var i = 0; i < inputs.length; i++) {
        sum += weights[i] * inputs[i];
      }

      return Math.max(0, sum);
    },

    network(process, layers, inputs) {
      var outputs = inputs.slice();

      for (var i = 0; i < layers.length; i++) {
        outputs = layers[i].map(function(layer) {
          return process(layer.bias, layer.weights, outputs);
        });
      }

      return outputs;
    },

    sigmoidNetwork(layers, inputs) {
      return this.network(this.sigmoid, layers, inputs);
    },

    softplusNetwork(layers, inputs) {
      return this.network(this.softplus, layers, inputs);
    },

    hardmaxNetwork(layers, inputs) {
      return this.network(this.hardmax, layers, inputs);
    }

  };

  exports.Neurons = Neurons;

}(window);
