!function(exports) {

  var DIRECTIONS = [
    [-1, 0], [0, 1],
    [1, 0], [0, -1]
  ];

  function Walls(waveFrequency) {
    this._waveFrequency = waveFrequency;
    this._frame = new Frame();
    this._cycle = 0;
  }

  Walls.prototype.getFrame = function() {
    return this._frame;
  };

  Walls.prototype.add = function(x, y) {
    this._frame.write(x, y, true);
  };

  Walls.prototype.loop = function(playersFrame) {
    this._frame.each(function(x, y, wall) {
      for (var i = 0; i < 25; i++) {
        for (var j = 0; j < DIRECTIONS.length; j++) {
          var direction = DIRECTIONS[j];
          player = playersFrame.read(
            x + i * direction[0],
            y + i * direction[1]
          );
          if (player) {
            player.sensors.walls[j] += 25 - i;
          }
        }
      }
    }.bind(this));

    this._cycle++;
  };

  exports.Walls = Walls;

}(window);
