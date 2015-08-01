var assert = require('assert');
var FeedForward = require('../src/feed_forward');

describe('FeedForward.HardMax', function() {
  describe('#process()', function () {
    it('should return correct outputs', function () {
      var network = new FeedForward.HardMax([2, 2, 2], [
        0, 1, -1,
        0, -1, 1,
        1, 2, 0,
        -1, 0, 1,
      ]);
      assert.deepEqual(Array.prototype.slice.call(network.process([1, 0])), [3, 0]);
      assert.deepEqual(Array.prototype.slice.call(network.process([2, -4])), [13, 0]);
      assert.deepEqual(Array.prototype.slice.call(network.process([-2, 4])), [1, 5]);
    });
  });
});
