var assert = require('assert');
var Neat = require('../src/neat');

function getNodeId(n, u, v) {
  return n._nodeGenes[u][v][0];
};

describe('Neat', function() {

  describe('#addNode()', function () {

    it('should add a node if a connection exists', function () {
      var n = new Neat(2, 7);
      var from = getNodeId(n, 0, 0);
      var to = getNodeId(n, 1, 4);
      assert.equal(n.addNode(from, to, 1, 2), true);
      var nodeId = getNodeId(n, 1, 0);
      assert.equal(n._nodeGenes.length, 3);
      assert.equal(n._nodeGenes[1].length, 1);
      assert.equal(n._connGenes.length, 16);
      assert.equal(n.findConnection(from, nodeId).enabled, true);
      assert.equal(n.findConnection(from, nodeId).weight, 1);
      assert.equal(n.findConnection(nodeId, to).enabled, true);
      assert.equal(n.findConnection(nodeId, to).weight, 2);
      assert.equal(n.findConnection(from, to).enabled, false);
    });

    it('should reuse layers if possile', function () {
      var n = new Neat(2, 7);
      var from = getNodeId(n, 0, 0);
      var to = getNodeId(n, 1, 4);
      n.addNode(from, to, 1, 1);
      from = getNodeId(n, 0, 1);
      to = getNodeId(n, 2, 0);
      n.addNode(from, to, 3, 0);
      var nodeId = getNodeId(n, 1, 1);
      assert.equal(n._nodeGenes.length, 3);
      assert.equal(n._nodeGenes[1].length, 2);
      assert.equal(n._connGenes.length, 18);
      assert.equal(n.findConnection(from, nodeId).enabled, true);
      assert.equal(n.findConnection(from, nodeId).weight, 3);
      assert.equal(n.findConnection(nodeId, to).enabled, true);
      assert.equal(n.findConnection(nodeId, to).weight, 0);
      assert.equal(n.findConnection(from, to).enabled, false);
    });

  });

  describe('#addConnection()', function () {

    it('should return false if an enabled connection exists', function () {
      var n = new Neat(4, 2);
      var input = getNodeId(n, 0, 2);
      var output = getNodeId(n, 1, 1);
      n.findConnection(input, output).enabled = true;
      assert.equal(n.addConnection(input, output, 1), false);
    });

    it('should enable the connection a disabled connection exists', function () {
      var n = new Neat(2, 7);
      var input = getNodeId(n, 0, 0);
      var output = getNodeId(n, 1, 5);
      n.findConnection(input, output).enabled = false;
      assert.equal(n.addConnection(input, output, 1), true);
      assert.equal(n.findConnection(input, output).enabled, true);
    });

    it('should return false if the input and output are on the same layer', function () {
      var n = new Neat(4, 2);
      var input = getNodeId(n, 0, 2);
      var output = getNodeId(n, 0, 1);
      assert.equal(n.addConnection(input, output, 1), false);
    });

    it('should return false if the input is after the output', function () {
      var n = new Neat(4, 2);
      var input = getNodeId(n, 1, 1);
      var output = getNodeId(n, 0, 1);
      assert.equal(n.addConnection(input, output, 1), false);
    });

    it('should add a connection if no connection exists', function () {
      var n = new Neat(2, 7);
      var from = getNodeId(n, 0, 0);
      var to = getNodeId(n, 1, 4);
      n.addNode(from, to, 1, 1);
      var input = getNodeId(n, 0, 1);
      var output = getNodeId(n, 1, 0);
      assert.equal(n.addConnection(input, output, -1), true);
      assert.equal(n.findConnection(input, output).enabled, true);
      assert.equal(n.findConnection(input, output).weight, -1);
    });

  });

});
