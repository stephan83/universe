!function(exports) {

  var DIRECTIONS = [
    [-1, 0], [0, 1], [1, -1], [1, 1],
    [1, 0], [0, -1], [-1, 1], [-1, -1]
  ];

  function Resources() {
    this._frame = new Frame();
  }

  Resources.prototype.getFrame = function() {
    return this._frame;
  };

  Resources.prototype.add = function(x, y, amount) {
    this._frame.write(x, y, amount);
  };

  Resources.prototype.loop = function(playersFrame, addResourceCallback) {
    playersFrame.each(function(x, y, player) {
      var resource = this._frame.read(x, y);

      if (resource) {
        player.resource = Math.max(100, player.resource + resource);
        this._frame.remove(x, y);
        addResourceCallback(resource);
        return;
      }

      for (var i = 1; i <= 25; i++) {
        for (var j = 0; j < DIRECTIONS.length; j++) {
          var direction = DIRECTIONS[j];
          resource = this._frame.read(
            x + i * direction[0],
            y + i * direction[1]
          );
          if (resource) {
            player.sensors.resources[j] += 26 - i;
          }
        }
      }
    }.bind(this));
  };

  exports.Resources = Resources;

}(window);
