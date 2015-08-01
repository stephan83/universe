// A feed forward network.
// NOTE: If you need to save the outputs, create a copy of the result because
// the returned subarray's buffer is reused. This is to avoid allocating
// memory unnecessary.

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
      dataLength += (sizes[i - 1] + 1) * sizes[i];
    }
  }

  if (data) {
    this._data = new Float32Array(data);
  } else {
    this._data = new Float32Array(dataLength);
    for (var i = 0; i < dataLength; i++) {
      this._data[i] = randomWeight();
    }
  }

  this._io = new Float32Array(ioLength);
  this._outputs = this._io.subarray(ioLength - sizes[sizes.length - 1]);
}

FeedForward.prototype.marshal = function() {
  return {
    sizes: Array.prototype.slice.call(this._sizes) ,
    data: Array.prototype.slice.call(this._data) 
  };
};

FeedForward.prototype.mutate = function() {
  var data = new Float32Array(this._data.length);
  for (var i = 0; i < this._data.length; i++) {
    data[i] = this._data[i] + (Math.random() < 0.1 ? randomWeight() : 0);
  }
  return new this.constructor(this._sizes, data);
};

FeedForward.prototype.mate = function(partner) {
  var data = new Float32Array(this._data.length);
  for (var i = 0; i < this._data.length; i++) {
    data[i] = Math.random() < 0.5 ? this._data[i] : partner._data[i];
  }
  return new this.constructor(this._sizes, data);
};

FeedForward.unmarshal = function(js) {
  return new this.constructor(js.sizes, js.data);
};

FeedForward.HardMax = function(sizes, data) {
  FeedForward.call(this, sizes, data);
};

FeedForward.HardMax.prototype.process = function(inputs) {
  this._io.set(inputs);
  var dataIndex = 0, readIndex = 0, writeIndex = this._sizes[0];
  var numInputs, numNeurons, sum, i, j, k;
  for (i = 1; i < this._sizes.length; i++) {
    numInputs = this._sizes[i - 1];
    numNeurons = this._sizes[i];
    for (j = 0; j < numNeurons; j++) {
      sum = this._data[dataIndex++];
      for (k = 0; k < numInputs; k++) {
        sum += this._data[dataIndex++] * this._io[readIndex + k];
      }
      this._io[writeIndex + j] = Math.max(0, sum);
    }
    readIndex += numInputs;
    writeIndex += numNeurons;
  }
  return this._outputs;
};

FeedForward.Sigmoid = function(sizes, data) {
  FeedForward.call(this, sizes, data);
};

FeedForward.Sigmoid.prototype.process = function(inputs) {
  this._io.set(inputs);
  var dataIndex = 0, readIndex = 0, writeIndex = this._sizes[0];
  var numInputs, numNeurons, sum, i, j, k;
  for (i = 1; i < this._sizes.length; i++) {
    numInputs = this._sizes[i - 1];
    numNeurons = this._sizes[i];
    for (j = 0; j < numNeurons; j++) {
      sum = this._data[dataIndex++];
      for (k = 0; k < numInputs; k++) {
        sum += this._data[dataIndex++] * this._io[readIndex + k];
      }
      this._io[writeIndex + j] = 1 / (1 - Math.exp(-sum));
    }
    readIndex += numInputs;
    writeIndex += numNeurons;
  }
  return this._outputs;
};

for (var s in FeedForward.prototype) {
  if (FeedForward.prototype.hasOwnProperty(s)) {
    FeedForward.HardMax.prototype[s] = FeedForward.prototype[s];
    FeedForward.Sigmoid.prototype[s] = FeedForward.prototype[s];
  }
}

module.exports = FeedForward;
