!function(exports) {

  function Waves(name, directions, initialEnergy) {
    this._name = name;
    this._directions = directions;
    this._initialEnergy = initialEnergy;
    this._frame = new Frame();
  }

  Waves.prototype.getFrame = function() {
    return this._frame;
  };

  Waves.prototype.emit = function(x, y, wallsFrame) {
    for (var i = 0; i < this._directions.length; i++) {
      var direction = this._directions[i];
      var startX = x + direction[0];
      var startY = y + direction[1];

      if (wallsFrame.read(startX, startY)) {
        continue;
      }

      var waves = this._frame.read(startX, startY) || [];

      waves.push({
        direction: i,
        energy: this._initialEnergy
      });

      this._frame.write(startX, startY, waves);
    }
  };

  Waves.prototype.loop = function(wallsFrame, playersFrame) {
    var previous = this._frame;
    this._frame = new Frame();

    previous.each(function(x, y, waves) {
      waves.forEach(function(wave) {
        wave.energy--;

        if (wave.energy > 0) {
          var direction = this._directions[wave.direction];
          var destX = x + direction[0];
          var destY = y + direction[1];

          if (wallsFrame.read(destX, destY)) {
            return;
          }

          var player = playersFrame.read(destX, destY);

          if (player) {
            player.sensors[this._name] = player.sensors[this._name] || [];
            var sensor = player.sensors[this._name];
            sensor[wave.direction] = sensor[wave.direction] || 0;
            sensor[wave.direction] += wave.energy;
            playersFrame.write(destX, destY, player);
          } else {
            var dest = this._frame.read(destX, destY) || [];
            dest.push(wave);
            this._frame.write(destX, destY, dest);
          }
        }
      }.bind(this));
    }.bind(this));
  };

  exports.Waves = Waves;

}(window);
