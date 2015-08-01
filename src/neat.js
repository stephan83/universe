var NODE_INPUT = 0;
var NODE_OUTPUT = 1;
var NODE_HIDDEN = 2;

function randomWeight() {
  return Math.random() < 0.5 ? Math.random() : -Math.random();
}

function randomEnabled() {
  return Math.random() < 0.9;
}

var nodeCount = 0;
var innovationCount = 0;

function Neat(numInputs, numOutputs, nodeGenes, connGenes) {
  this._numInputs = numInputs;
  this._numOutputs = numOutputs;
  this._nodeGenes = nodeGenes;
  this._connGenes = connGenes;
  this._nodeToLayerMap = {};
  this._nodeInputs = [];
  this._nodeOutputs = [];

  if (!this._nodeGenes) {
    this._nodeGenes = [];
    this._connGenes = [];

    var inputNodes = [];

    for (var i = 0; i < numInputs; i++) {
      inputNodes.push([nodeCount++, NODE_INPUT]);
    }

    this._nodeGenes.push(inputNodes);

    var outputNodes = [];

    for (i = 0; i < numOutputs; i++) {
      outputNodes.push([nodeCount++, NODE_OUTPUT]);
    }

    this._nodeGenes.push(outputNodes);

    for (i = 0; i < numInputs; i++) {
      for (j = 0; j < numOutputs; j++) {
        this._connGenes.push({
          input: inputNodes[i][0],
          output: outputNodes[j][0],
          weight: randomWeight(),
          enabled: randomEnabled(),
          innovation: innovationCount++
        });
      }
    }
  }

  for (i = 0; i < this._nodeGenes.length; i++) {
    var layer = this._nodeGenes[i];
    for (j = 0; j < layer.length; j++) {
      var node = layer[j];
      this._nodeToLayerMap[node[0]] = layer;
    }
  }

  for (i = 0; i < this._connGenes.length; i++) {
    var conn = this._connGenes[i];
    this._nodeInputs[conn.output] = this._nodeInputs[conn.output] || [];
    this._nodeInputs[conn.output].push(conn);
    this._nodeOutputs[conn.input] = this._nodeOutputs[conn.input] || [];
    this._nodeOutputs[conn.input].push(conn);
  }
}

Neat.prototype.process = function(inputs) {
  var nodeValues = [];

  for (var i = 0; i < this._nodeGenes[0].length; i++) {
    var node = this._nodeGenes[0][i];
    nodeValues[node[0]] = inputs[i];
  }

  for (i = 1; i < this._nodeGenes.length; i++) {
    var layer = this._nodeGenes[i];
    for (var j = 0; j < layer.length; j++) {
      node = layer[j];
      var nodeInputs = this._nodeInputs[node[0]];
      var sum = 0;

      for (var k = 0; k < nodeInputs.length; k++) {
        var inputConn = nodeInputs[k];
        if (inputConn.enabled) {
          sum += (nodeValues[inputConn.input] || 0) * inputConn.weight;
        }
      }

      nodeValues[node[0]] = Math.max(0, sum);
    }
  }

  var outputs = [];

  for (i = 0; i < this._nodeGenes[this._nodeGenes.length - 1].length; i++) {
    node = layer[i];
    outputs[i] = nodeValues[node[0]] || 0;
  }

  return outputs;
};

Neat.prototype.findConnection = function(input, output) {
  var conns = this._nodeOutputs[input];

  if (!conns) {
    return false;
  }

  for (var i = 0; i < conns.length; i++) {
    var conn = conns[i];
    if (conn.output === output) {
      return conn;
    }
  }
};

Neat.prototype.addConnection = function(input, output, weight) {
  var existing = this.findConnection(input, output);
  if (existing) {
    if (existing.enabled) {
      return false;
    }
    existing.enabled = true;
    return true;
  }

  var inputLayer = this._nodeToLayerMap[input];
  var outputLayer = this._nodeToLayerMap[output];
  var inputLayerIndex = this._nodeGenes.indexOf(inputLayer);
  var outputLayerIndex = this._nodeGenes.indexOf(outputLayer);

  if (inputLayerIndex >= outputLayerIndex) {
    return false;
  }

  var conn = {
    input: input,
    output: output,
    weight: weight,
    enabled: true,
    innovation: innovationCount++
  };

  this._connGenes.push(conn);

  this._nodeInputs[conn.output] = this._nodeInputs[conn.output] || [];
  this._nodeInputs[conn.output].push(conn);
  this._nodeOutputs[conn.input] = this._nodeOutputs[conn.input] || [];
  this._nodeOutputs[conn.input].push(conn);

  return true;
};

Neat.prototype.addNode = function(input, output, weight1, weight2) {
  var conn = this.findConnection(input, output);

  if (!conn) {
    return false;
  }

  var inputLayer = this._nodeToLayerMap[input];
  var outputLayer = this._nodeToLayerMap[output];
  var inputLayerIndex = this._nodeGenes.indexOf(inputLayer);
  var outputLayerIndex = this._nodeGenes.indexOf(outputLayer);

  if (inputLayerIndex >= outputLayerIndex) {
    return false;
  }

  var nodeId = nodeCount++;

  if (inputLayerIndex + 1 === outputLayerIndex) {
    var layerIndex = outputLayerIndex;
    this._nodeGenes.splice(layerIndex, 0, [[nodeId, NODE_HIDDEN]]);
  } else {
    layerIndex = Math.floor((inputLayerIndex + outputLayerIndex) * 0.5);
    this._nodeGenes[layerIndex].push([nodeId, NODE_HIDDEN]);
  }

  this._nodeToLayerMap[nodeId] = this._nodeGenes[layerIndex];
  conn.enabled = false;
  this.addConnection(input, nodeId, weight1);
  this.addConnection(nodeId, output, weight2);

  return true;
};

module.exports = Neat;
