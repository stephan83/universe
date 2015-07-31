!function(exports) {

  var DIRECTIONS = [
    [-1, 0], [0, 1], [1, -1], [1, 1],
    [1, 0], [0, -1], [-1, 1], [-1, -1]
  ];

  function Resources(waveFrequency) {
    this._waveFrequency = waveFrequency;
    this._frame = new Frame();
    this._cycle = 0;
  }

  Resources.prototype.getFrame = function() {
    return this._frame;
  };

  Resources.prototype.add = function(x, y, amount) {
    this._frame.write(x, y, amount);
  };

  Resources.prototype.loop = function(playersFrame) {
    this._frame.each(function(x, y, amount) {
      var player = playersFrame.read(x, y);

      if (player) {
        player.resource += amount;
        this._frame.remove(x, y);
        return;
      }

      for (var i = 0; i < 25; i++) {
        for (var j = 0; j < DIRECTIONS.length; j++) {
          var direction = DIRECTIONS[j];
          player = playersFrame.read(
            x + i * direction[0],
            y + i * direction[1]
          );
          if (player) {
            player.sensors.resources[j] += 25 - i;
          }
        }
      }
    }.bind(this));

    this._cycle++;
  };

  exports.Resources = Resources;

}(window);
