!function(exports) {

  var Neurons = {

    sigmoid: function(bias, weights, inputs) {
      var sum = bias;

      for (var i = 0; i < inputs.length; i++) {
        sum += weights[i] * inputs[i];
      }

      return 1 / (1 + Math.exp(-sum));
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
    }

  };

  exports.Neurons = Neurons;

}(window);
