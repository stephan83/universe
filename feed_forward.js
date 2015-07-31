!function(exports) {

  function randomWeight() {
    return Math.random() < 0.5 ? Math.random() : -Math.random();
  }

  function FeedForward(sizes, _data) {
    this._sizes = sizes.slice();
    if (_data) {
      this._data = _data;
    } else {
      var length = 0;
      for (var i = 1; i < sizes.length; i++) {
        length += (sizes[i - 1] + 1) * sizes[i];
      }
      this._data = _data || new Float32Array(length);
      for (var i = 0; i < length; i++) {
        this._data[i] = randomWeight();
      }
    }
  }

  FeedForward.prototype.marshal = function() {
    return {
      sizes: this._sizes,
      data: Array.prototype.slice.call(this._data) 
    };
  };

  FeedForward.prototype.process = function(inputs) {
    var outputs;
    var l = 0;
    for (var i = 1; i < this._sizes.length; i++) {
      var numInputs = this._sizes[i - 1];
      var numNeurons = this._sizes[i];
      var outputs = [];
      for (var j = 0; j < numNeurons; j++) {
        var sum = this._data[l++];
        for (var k = 0; k < numInputs; k++) {
          sum += this._data[l++] * inputs[k];
        }
        outputs[j] = Math.max(0, sum);
      }
      inputs = outputs;
    }
    return outputs;
  };

  FeedForward.prototype.mutate = function() {
    var data = new Float32Array(this._data.length);
    for (var i = 0; i < this._data.length; i++) {
      data[i] = this._data[i] + (Math.random() < 0.1 ? randomWeight() : 0);
    }
    return new FeedForward(this._sizes, data);
  };

  FeedForward.unmarshal = function(js) {
    return new FeedForward(js.sizes.slice(), new Float32Array(js.data));
  };

  FeedForward.mate = function(a, b) {
    var data = new Float32Array(a._data.length);
    for (var i = 0; i < a._data.length; i++) {
      data[i] = Math.random() < 0.5 ? a._data[i] : b._data[i];
    }
    return new FeedForward(a._sizes, data);
  };

  exports.FeedForward = FeedForward;

}(window);
