function Decidor(numInputs, numOutputs, maxNodes, nodes) {
  this._numInputs = numInputs;
  this._numOutputs = numOutputs;
  this._maxNodes = maxNodes || 0xFFFF;
  this._nodeMap = nodes || {};
  this._numNodes = 0;
  this._prevInputs = null;
  this._prevOutput = null;
}

Decidor.prototype.process = function(inputs, score) {
  if (this._prevInputs) {
    if (score !== 0) {
      this._promote(this._prevInputs, this._prevOutput, score);
    }
  }

  var output = this._decide(inputs);

  if (output < 0) {
    output = Math.floor(Math.random() * this._numOutputs);
  }

  this._prevInputs = inputs;
  this._prevOutput = output;

  return output;
};

Decidor.prototype.clone = function() {
  var nodes = {};

  for (var hash in this._nodeMap) {
    if (this._nodeMap.hasOwnProperty(hash)) {
      nodes[hash] = this._nodeMap[hash];
    }
  }

  return new Decidor(this._numInputs, this._numOutputs, nodes);
};

Decidor.prototype._decide = function(inputs) {
  var outputs = [];
  for (var i = 0; i < this._numOutputs; i++) {
    outputs.push(0);
  }

  for (var hash in this._nodeMap) {
    if (this._nodeMap.hasOwnProperty(hash)) {
      var node = this._nodeMap[hash];
      var o = this._unhash(hash);
      var ins = o.inputs;
      var out = o.output;
      for (var i = 0; i < ins.length; i++) {
        var input = inputs[ins[i]];
        var weight = node[i];
        outputs[out] += input * weight;
      }
    }
  }

  var bestValue = 0;
  var bestIndex = -1;

  for (var i = 0; i < this._numOutputs; i++) {
    if (outputs[i] > bestValue) {
      bestValue = outputs[i];
      bestIndex = i;
    }
  }

  if (bestIndex > -1 && 1 / (1 - Math.exp(-bestValue)) >= 0.5) {
    return bestIndex;
  }

  return -1;
};

Decidor.prototype._addNode = function(inputs, output, weight) {
  var node = [];
  for (var i = 0; i < inputs.length; i++) {
    node.push(weight);
  }
  this._nodeMap[this._hash(inputs, output)] = node;
  this._numNodes++;
};

Decidor.prototype._findNode = function(inputs, output) {
  return this._nodeMap[this._hash(inputs, output)];
};

Decidor.prototype._promote = function(inputs, output, score) {
  var node = this._findNode(inputs, output);
  if (node) {
    for (var i = 0; i < node.length; i++) {
      node[i] += score;
    }
    return;
  }
  this._addNode(inputs, output, score);
};

Decidor.prototype._hash = function(inputs, output) {
  var ins = [];
  inputs.forEach(function(i, index) {
    if (i > 0) {
      ins.push(index);
    }
  });
  var hash = ins.join(':');
  return hash + '->' + output;
};

Decidor.prototype._unhash = function(hash) {
  var a = hash.split('->');
  var b = a[0].split(':');
  return {inputs: b, output: a[1]};
};

module.exports = Decidor;
