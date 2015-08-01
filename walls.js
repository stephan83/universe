!function(exports) {

  var DIRECTIONS = [
    [-1, 0], [0, 1],
    [1, 0], [0, -1]
  ];

  function Walls() {
    this._frame = new Frame();
  }

  Walls.prototype.getFrame = function() {
    return this._frame;
  };

  Walls.prototype.setPlayersFrame = function(value) {
    this._playersFrame = value;
  };

  Walls.prototype.add = function(x, y) {
    this._frame.write(x, y, true);
  };

  Walls.prototype.loop = function() {
    this._playersFrame.each(this._playerLoop, this);
  };

  Walls.prototype._playerLoop = function(x, y, player) {
    for (var j = 0; j < DIRECTIONS.length; j++) {
      var direction = DIRECTIONS[j];
      for (var i = 1; i <= 25; i++) {
        var wall = this._frame.read(
          x + i * direction[0],
          y + i * direction[1]
        );
        if (wall) {
          player.sensors.walls[j] += 26 - i;
          break;
        }
      }
    }
  };

  exports.Walls = Walls;

}(window);
