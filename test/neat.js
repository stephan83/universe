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
      n.addConnection(from, to, 1);
      assert.equal(n.addNode(from, to, Neat.NODE_HARDMAX, 1, 2), true);
      var nodeId = getNodeId(n, 1, 0);
      assert.equal(n._nodeGenes.length, 3);
      assert.equal(n._nodeGenes[1].length, 1);
      assert.equal(n._connGenes.length, 3);
      assert.equal(n.findConnection(from, nodeId).enabled, true);
      assert.equal(n.findConnection(from, nodeId).weight, 1);
      assert.equal(n.findConnection(nodeId, to).enabled, true);
      assert.equal(n.findConnection(nodeId, to).weight, 2);
      assert.equal(n.findConnection(from, to).enabled, false);
    });

    it('should reuse layers if possible', function () {
      var n = new Neat(2, 7);
      var from = getNodeId(n, 0, 0);
      var to = getNodeId(n, 1, 4);
      n.addConnection(from, to, 1);
      n.addNode(from, to, Neat.NODE_HARDMAX, 1, 1);
      from = getNodeId(n, 0, 1);
      to = getNodeId(n, 2, 0);
      n.addConnection(from, to, 1);
      n.addNode(from, to, Neat.NODE_HARDMAX, 3, 0);
      var nodeId = getNodeId(n, 1, 1);
      assert.equal(n._nodeGenes.length, 3);
      assert.equal(n._nodeGenes[1].length, 2);
      assert.equal(n._connGenes.length, 6);
      assert.equal(n.findConnection(from, nodeId).enabled, true);
      assert.equal(n.findConnection(from, nodeId).weight, 3);
      assert.equal(n.findConnection(nodeId, to).enabled, true);
      assert.equal(n.findConnection(nodeId, to).weight, 0);
      assert.equal(n.findConnection(from, to).enabled, false);
    });

    it('should add more layers if needed', function () {
      var n = new Neat(2, 7);
      var from = getNodeId(n, 0, 0);
      var to = getNodeId(n, 1, 4);
      n.addConnection(from, to, 1);
      n.addNode(from, to, Neat.NODE_HARDMAX, 1, 1);
      to = getNodeId(n, 1, 0);
      n.addNode(from, to, Neat.NODE_HARDMAX, -1, 0);
      var nodeId = getNodeId(n, 1, 0);
      assert.equal(n._nodeGenes.length, 4);
      assert.equal(n._nodeGenes[1].length, 1);
      assert.equal(n._connGenes.length, 5);
      assert.equal(n.findConnection(from, nodeId).enabled, true);
      assert.equal(n.findConnection(from, nodeId).weight, -1);
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
      n.addConnection(input, output, 1);
      n.findConnection(input, output).enabled = true;
      assert.equal(n.addConnection(input, output, 1), false);
    });

    it('should enable the connection a disabled connection exists', function () {
      var n = new Neat(2, 7);
      var input = getNodeId(n, 0, 0);
      var output = getNodeId(n, 1, 5);
      n.addConnection(input, output, 1);
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
      var input = getNodeId(n, 0, 1);
      var output = getNodeId(n, 1, 0);
      assert.equal(n.addConnection(input, output, -1), true);
      assert.equal(n.findConnection(input, output).enabled, true);
      assert.equal(n.findConnection(input, output).weight, -1);
    });

  });

  describe('#process()', function () {

    it('should work even without hidden nodes', function () {
      var n = new Neat(2, 3);
      n.addConnection(getNodeId(n, 0, 0), getNodeId(n, 1, 0), 1);
      n.addConnection(getNodeId(n, 0, 1), getNodeId(n, 1, 0), -1);
      n.addConnection(getNodeId(n, 0, 0), getNodeId(n, 1, 1), -1);
      n.addConnection(getNodeId(n, 0, 1), getNodeId(n, 1, 1), 1);
      n.addConnection(getNodeId(n, 0, 0), getNodeId(n, 1, 2), -10);
      n.addConnection(getNodeId(n, 0, 1), getNodeId(n, 1, 2), -2);
      var con = n.findConnection(getNodeId(n, 0, 1), getNodeId(n, 1, 1));
      con.enabled = false;
      assert.deepEqual(n.process([-1,4]), [0, 1, 2]);
    });

    it('should work with hidden nodes', function () {
      var n = new Neat(2, 3);
      n.addConnection(getNodeId(n, 0, 0), getNodeId(n, 1, 0), 1);
      n.addConnection(getNodeId(n, 0, 1), getNodeId(n, 1, 0), -1);
      n.addConnection(getNodeId(n, 0, 0), getNodeId(n, 1, 1), -1);
      n.addConnection(getNodeId(n, 0, 1), getNodeId(n, 1, 1), 1);
      n.addConnection(getNodeId(n, 0, 0), getNodeId(n, 1, 2), -10);
      n.addConnection(getNodeId(n, 0, 1), getNodeId(n, 1, 2), -2);
      var con = n.findConnection(getNodeId(n, 0, 1), getNodeId(n, 1, 1));
      con.enabled = false;
      n.addNode(getNodeId(n, 0, 1), getNodeId(n, 1, 2), Neat.NODE_HARDMAX, 2, 1);
      assert.deepEqual(n.process([-1,4]), [0, 1, 18]);
    });

  });

});
