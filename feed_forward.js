!function(exports) {

  // A feed forward network, using hardmax.

  function randomWeight() {
    return Math.random() < 0.5 ? Math.random() : -Math.random();
  }

  function FeedForward(sizes, data) {
    this._sizes = new Float32Array(sizes);

    var dataLength = 0;
    var ioLength = 0;
    for (var i = 0; i < sizes.length; i++) {
      ioLength += sizes[i];
      if (i > 0) {
        length += (sizes[i - 1] + 1) * sizes[i];
      }
    }

    if (data) {
      this._data = new Float32Array(data);
    } else {
      this._data = new Float32Array(length);
      for (var i = 0; i < length; i++) {
        this._data[i] = randomWeight();
      }
    }

    this._io = new Float32Array(ioLength);
    this._outputs = this._io.subarray(0, sizes[sizes.length - 1]);
  }

  FeedForward.prototype.marshal = function() {
    return {
      sizes: Array.prototype.slice.call(this._sizes) ,
      data: Array.prototype.slice.call(this._data) 
    };
  };

  // NOTE: If you need to save the outputs, create a copy of the result because
  // the returned subarray's buffer is reused. This is to avoid allocating
  // memory unnecessary.
  FeedForward.prototype.process = function(inputs) {
    this._io.set(inputs);
    var dataIndex = 0, ioIndex = 0;
    var numInputs, numNeurons, sum, i, j, k;
    for (i = 1; i < this._sizes.length; i++) {
      numInputs = this._sizes[i - 1];
      numNeurons = this._sizes[i];
      for (j = 0; j < numNeurons; j++) {
        sum = this._data[dataIndex++];
        for (k = 0; k < numInputs; k++) {
          sum += this._data[dataIndex++] * this._io[ioIndex + k];
        }
        this._io[ioIndex + numInputs + j] = Math.max(0, sum);
      }
      ioIndex += numInputs;
    }
    return this._outputs;
  };

  FeedForward.prototype.mutate = function() {
    var data = new Float32Array(this._data.length);
    for (var i = 0; i < this._data.length; i++) {
      data[i] = this._data[i] + (Math.random() < 0.1 ? randomWeight() : 0);
    }
    return new FeedForward(this._sizes, data);
  };

  FeedForward.unmarshal = function(js) {
    return new FeedForward(js.sizes, js.data);
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
