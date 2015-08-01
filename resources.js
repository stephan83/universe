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

  Resources.prototype.setPlayersFrame = function(value) {
    this._playersFrame = value;
  };

  Resources.prototype.setWallsFrame = function(value) {
    this._wallsFrame = value;
  };

  Resources.prototype.setAddResource = function(value) {
    this._addResource = value;
  };

  Resources.prototype.add = function(x, y, amount) {
    this._frame.write(x, y, amount);
  };

  Resources.prototype.loop = function() {
    this._playersFrame.each(this._playerLoop, this);
  };

  Resources.prototype._playerLoop = function(x, y, player) {
    var resource = this._frame.read(x, y);

    if (resource) {
      player.resource = Math.min(100, player.resource + resource);
      this._frame.remove(x, y);
      this._addResource(resource);
      return;
    }

    for (var j = 0; j < DIRECTIONS.length; j++) {
      var direction = DIRECTIONS[j];
      for (var i = 1; i <= 25; i++) {
        var wall = this._wallsFrame.read(
          x + i * direction[0],
          y + i * direction[1]
        );
        if (wall) {
          break;
        }
        resource = this._frame.read(
          x + i * direction[0],
          y + i * direction[1]
        );
        if (resource) {
          player.sensors.resources[j] += 26 - i;
          break;
        }
      }
    }
  };

  exports.Resources = Resources;

}(window);
