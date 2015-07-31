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

  Walls.prototype.add = function(x, y) {
    this._frame.write(x, y, true);
  };

  Walls.prototype.loop = function(playersFrame) {
    playersFrame.each(function(x, y, player) {
      for (var i = 1; i <= 25; i++) {
        for (var j = 0; j < DIRECTIONS.length; j++) {
          var direction = DIRECTIONS[j];
          var wall = this._frame.read(
            x + i * direction[0],
            y + i * direction[1]
          );
          if (wall) {
            player.sensors.walls[j] += 26 - i;
          }
        }
      }
    }.bind(this));
  };

  exports.Walls = Walls;

}(window);
