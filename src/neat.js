// Neat with feed forward nodes only

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

  // Alway start at 0 for input and output nodes
  var startNodeCount = 0;

  if (!this._nodeGenes) {
    this._nodeGenes = [];
    this._connGenes = [];

    var inputNodes = [];

    for (var i = 0; i < numInputs; i++) {
      inputNodes.push([startNodeCount++, Neat.NODE_INPUT]);
    }

    this._nodeGenes.push(inputNodes);

    var outputNodes = [];

    for (i = 0; i < numOutputs; i++) {
      outputNodes.push([startNodeCount++, Neat.NODE_OUTPUT]);
    }

    this._nodeGenes.push(outputNodes);
  }

  nodeCount = Math.max(startNodeCount, nodeCount);

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

Neat.NODE_INPUT = 0;
Neat.NODE_OUTPUT = 1;
Neat.NODE_SIGMOID = 2;
Neat.NODE_HARDMAX = 3;

Neat.prototype.process = function(inputs) {
  var nodeValues = [];

  for (var i = 0; i < this._numInputs; i++) {
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

      if (node[1] === Neat.NODE_HARDMAX) {
        nodeValues[node[0]] = Math.max(0, sum);
      } else {
        nodeValues[node[0]] = 1 / (1 + Math.exp(-4.9 * sum));
      }
    }
  }

  var outputs = [];

  for (i = 0; i < this._numOutputs; i++) {
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

Neat.prototype.addConnection = function(input, output, weight, innovation, disabled) {
  var existing = this.findConnection(input, output);
  if (existing) {
    if (existing.enabled) {
      return false;
    }
    existing.enabled = true;
    existing.weight = weight || randomWeight();
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
    weight: typeof weight === 'undefined' ? randomWeight() : weight,
    enabled: !disabled,
    innovation: typeof innovation === 'undefined' ? innovationCount++ : innovation
  };

  this._connGenes.push(conn);

  this._nodeOutputs[conn.input] = this._nodeOutputs[conn.input] || [];
  this._nodeOutputs[conn.input].push(conn);
  this._nodeInputs[conn.output] = this._nodeInputs[conn.output] || [];
  this._nodeInputs[conn.output].push(conn);

  return true;
};

Neat.prototype.addNode = function(input, output, weight1, weight2, id, innov1, innov2, dis1, dis2) {
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

  var nodeId = typeof id === 'undefined' ? nodeCount++ : id;

  if (inputLayerIndex + 1 === outputLayerIndex) {
    var layerIndex = outputLayerIndex;
    this._nodeGenes.splice(layerIndex, 0, [[nodeId, Neat.NODE_SIGMOID]]);
  } else {
    layerIndex = Math.floor((inputLayerIndex + outputLayerIndex) * 0.5);
    this._nodeGenes[layerIndex].push([nodeId, Neat.NODE_SIGMOID]);
  }

  this._nodeToLayerMap[nodeId] = this._nodeGenes[layerIndex];
  conn.enabled = false;
  this.addConnection(input, nodeId, weight1, innov1, dis1);
  this.addConnection(nodeId, output, weight2, innov2, dis2);
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
  var inputs = [];
  var outputs = [];

  this._nodeGenes.slice(0, -1).forEach(function(layer, i) {
    layer.forEach(function(node) {
      var id = node[0];
      inputs.push({
        layer: i,
        id: id,
        numConn: this._nodeOutputs[id] ? this._nodeOutputs[id].length : 0
      });
    }.bind(this));
  }.bind(this));

  inputs.sort(function(a, b) {
    return (a.numConn - b.numConn) || (Math.random() < 0.5 ? 1 : -1);
  });

  var inputNode = inputs[0];

  this._nodeGenes.slice(inputNode.layer + 1).forEach(function(layer, i) {
    layer.forEach(function(node) {
      var id = node[0];
      var nodeInputs = this._nodeInputs[id] || [];
      for (var i = 0; i < nodeInputs.length; i++) {
        var conn = nodeInputs[i];
        if (conn.input === inputNode.id && conn.enabled) {
          return;
        }
      }
      outputs.push({
        layer: i,
        id: id,
        numConn: nodeInputs.length
      });
    }.bind(this));
  }.bind(this));

  outputs.sort(function(a, b) {
    return (a.numConn - b.numConn) || (Math.random() < 0.5 ? 1 : -1);
  });

  var outputNode = outputs[0];

  return [inputNode.id, outputNode.id];
}

Neat.prototype.mutate = function() {
  var clone = this.clone();

  if (Math.random() < 0.8) {
    for (var i = 0; i < clone._connGenes.length; i++) {
      if (Math.random() < 0.9) {
        clone._connGenes[i].weight += randomWeight() * 0.5;
      } else {
        clone._connGenes[i].weight = randomWeight();
      }
    }
  }

  if (Math.random() < 0.5 || !clone._connGenes.length) {
    var inputOutput = clone._randomInputOutput();
    var from = inputOutput[0];
    var to = inputOutput[1];
    clone.addConnection(from, to, randomWeight());
  }

  if (Math.random() < 0.3 && clone._connGenes.length) {
    for (i = 0; i < 100; i++) {
      conn = clone._connGenes[Math.floor(Math.random() * clone._connGenes.length)];
      if (!conn.enabled) {
        continue;
      }
      if (clone._nodeInputs[conn.input] &&
          clone._nodeInputs[conn.input].length < 2) {
        continue;
      }
      if (clone._nodeInputs[conn.output].length < 2) {
        continue;
      }
      clone.addNode(conn.input, conn.output, 1, conn.weight);
      break;
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
  var colors = ['#666666', '#666666', '#3333CC', '#CC3333'];

  var maxY = 0;

  this._nodeGenes.forEach(function(layer) {
    maxY = Math.max(maxY, layer.length);
  });

  this._nodeGenes.forEach(function(layer, x) {
    var top = 0.5 * maxY / layer.length;
    layer.forEach(function(node, y) {
      nodes.push({
        id: 'n' + node[0],
        x: x * 10,
        y: y * maxY / layer.length + top,
        size: 1,
        color: colors[node[1]]
      });
    });
  });

  this._connGenes.forEach(function(conn) {
    if (conn.enabled) {
      edges.push({
        id: 'e' + conn.innovation,
        source: 'n' + conn.input,
        target: 'n' + conn.output,
        color: conn.weight >= 0 ? '#00CCCC' : '#CC00CC'
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

Neat.mate = function(a, b, fitness1, fitness2) {
  var child = new Neat(a._numInputs, b._numOutputs);
  var disjoint = 0;
  var excess = 0;
  var ai = 0;
  var bi = 0;
  var mem;

  function addGene(gene) {
    if (!child._nodeToLayerMap[gene.output]) {
      mem = gene;
      return;
    }
    if (!child._nodeToLayerMap[gene.input]) {
      if (!mem) {
        throw new Error('Unexpected gene');
      }
      child.addNode(
        mem.input, gene.output,
        mem.weight, gene.weight,
        mem.output,
        mem.innovation, gene.innovation,
        mem.enabled ? false : Math.random() < 0.75,
        gene.enabled ? false : Math.random() < 0.75
      );
      mem = null;
      return;
    }
    child.addConnection(
      gene.input, gene.output,
      gene.weight, gene.innovation,
      gene.enabled ? false : Math.random() < 0.75
    );
  }

  for (var i = 0; true; i++) {
    if (ai < a._connGenes.length) {
      var ag = a._connGenes[ai];
    } else {
      ag = null;
    }
    if (bi < b._connGenes.length) {
      var bg = b._connGenes[bi];
    } else {
      bg = null;
    }
    if (!ag && !bg) {
      break;
    }
    if (ag && !bg) {
      if (fitness1 < fitness2) {
        break;
      }
      ai++;
      excess++;
      addGene(ag);
      continue;
    }
    if (!ag && bg) {
      if (fitness2 < fitness1) {
        break;
      }
      bi++;
      excess++;
      addGene(bg);
      continue;
    }
    if (ag.innovation === bg.innovation) {
      ai++;
      bi++;
      var g = Math.random() < 0.5 ? ag : bg;
      addGene(g);
      continue;
    }
    disjoint++;
    if (ag.innovation < bg.innovation) {
      ai++;
      if (fitness1 > fitness2) { 
        addGene(ag);
      }
      continue;
    }
    bi++;
    if (fitness2 > fitness1) { 
      addGene(bg);
    }
  }

  var tolerance = Math.log(child._connGenes.filter(function(g) {
    return g.enabled;
  }).length);

  if (disjoint > tolerance) {
    return;
  }

  if (excess > tolerance * 2) {
    return;
  }

  return child;
}

module.exports = Neat;
