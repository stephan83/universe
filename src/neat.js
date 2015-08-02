// Neat with feed forward nodes only

var NODE_INPUT = 0;
var NODE_OUTPUT = 1;
var NODE_HIDDEN = 2;

function randomWeight() {
  return Math.random() < 0.5 ? Math.random() : -Math.random();
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
  }

  this._numNodeGenes = 0;

  for (i = 0; i < this._nodeGenes.length; i++) {
    var layer = this._nodeGenes[i];
    this._numNodeGenes += layer.length;
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

      if (!nodeInputs) {
        continue;
      }

      var sum = 0;

      for (var k = 0; k < nodeInputs.length; k++) {
        var inputConn = nodeInputs[k];
        if (inputConn.enabled) {
          sum += (nodeValues[inputConn.input] || 0) * inputConn.weight;
        }
      }

      nodeValues[node[0]] = 1 / (1 + Math.exp(-sum));
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
  this._numNodeGenes++;

  return true;
};

Neat.prototype.clone = function() {
  var nodes = this._nodeGenes.map(function(layer) {
    return layer.map(function(gene) {
      return gene.slice();
    });
  });
  var connections = this._connGenes.map(function(gene) {
    return {
      input: gene.input,
      output: gene.output,
      weight: gene.weight,
      enabled: gene.enabled,
      innovation: gene.innovation
    };
  });
  return new Neat(this._numInputs, this._numOutputs, nodes, connections);
}

Neat.prototype._randomInputOutput = function() {
  var len = this._nodeGenes.length - 1;
  var numOutputs = this._nodeGenes[len].length;
  var numPrev = 0;
  var inputPos = Math.floor(Math.random() * (this._numNodeGenes - numOutputs));
  for (var i = 0; numPrev <= inputPos; i++) {
    var layer = this._nodeGenes[i];
    numPrev += layer.length;
  }
  var input = layer[Math.floor(Math.random() * layer.length)][0];

  var outputPos = numPrev + Math.floor(Math.random() * (this._numNodeGenes - numPrev));

  for (; numPrev <= outputPos; i++) {
    layer = this._nodeGenes[i];
    numPrev += layer.length;
  }
  var output = layer[Math.floor(Math.random() * layer.length)][0];

  return [input, output];
}

Neat.prototype.mutate = function() {
  var clone = this.clone();

  for (var i = 0; i < clone._connGenes.length; i++) {
    if (clone._connGenes[i].enabled && Math.random() < 0.1) {
      clone._connGenes[i].weight += randomWeight();
    }
  }

  if (Math.random() < 0.9) {
    // Add connection
    i = 0;
    do {
      var inputOutput = this._randomInputOutput();
      var from = inputOutput[0];
      var to = inputOutput[1];
      var conn = this.findConnection(from, to);
    } while(conn && i++ < 100);

    if (!conn) {
      clone.addConnection(from, to, randomWeight());
    }
  } else {
    // Add node
    i = 0;
    do {
      var inputOutput = this._randomInputOutput();
      var from = inputOutput[0];
      var to = inputOutput[1];
      var conn = this.findConnection(from, to);
    } while((!conn || conn.disabled) && i++ < 100);

    if (conn) {
      clone.addNode(from, to, 1, conn.weight);
    }
  }

  return clone;
};

Neat.prototype.marshal = function() {
  var nodes = this._nodeGenes.map(function(layer) {
    return layer.map(function(gene) {
      return gene.slice();
    });
  });
  var connections = this._connGenes.map(function(gene) {
    return {
      input: gene.input,
      output: gene.output,
      weight: gene.weight,
      enabled: gene.enabled,
      innovation: gene.innovation
    };
  });
  return {
    nodes: nodes,
    connections: connections
  };
}

Neat.prototype.toGraph = function() {
  var nodes = [];
  var edges = [];

  this._nodeGenes.forEach(function(layer, x) {
    layer.forEach(function(node, y) {
      nodes.push({
        id: 'n' + node[0],
        x: x * 10,
        y: y,
        size: 1
      });
    });
  });

  this._connGenes.forEach(function(conn) {
    if (conn.enabled) {
      edges.push({
        id: 'e' + conn.innovation,
        source: 'n' + conn.input,
        target: 'n' + conn.output,
        label: conn.weight.toFixed(2)
      });
    }
  });

  return {nodes: nodes, edges: edges}; 
};

Neat.unmarshal = function(obj) {
  var nodes = obj.nodes.map(function(layer) {
    return layer.map(function(gene) {
      return gene.slice();
    });
  });
  var connections = obj.connections.map(function(gene) {
    return {
      input: gene.input,
      output: gene.output,
      weight: gene.weight,
      enabled: gene.enabled,
      innovation: gene.innovation
    };
  });
  return new Neat(
    nodes[0].length,
    nodes[nodes.length - 1],
    nodes,
    connections
  );
}

module.exports = Neat;
