!function(exports) {

  function Missiles(directions, cost, initialEnergy) {
    this._directions = directions;
    this._cost = cost;
    this._initialEnergy = initialEnergy;
    this._frame = new Frame();
  }

  Missiles.prototype.getFrame = function() {
    return this._frame;
  };

  Missiles.prototype.getCost = function() {
    return this._cost;
  };

  Missiles.prototype.fire = function(player, x, y, dir, wallsFrame) {
    var direction = this._directions[dir];
    var startX = x + direction[0];
    var startY = y + direction[1];

    if (wallsFrame.read(startX, startY)) {
      return;
    }

    var missiles = this._frame.read(startX, startY) || [];

    missiles.push({
      direction: dir,
      energy: this._initialEnergy
    });

    this._frame.write(startX, startY, missiles);
  };

  Missiles.prototype.loop = function(wallsFrame, playersFrame) {
    var previous = this._frame;
    this._frame = new Frame();

    previous.each(function(x, y, missiles) {
      missiles.forEach(function(missile) {
        missile.energy--;

        if (missile.energy > 0) {
          var direction = this._directions[missile.direction];
          var destX = x + direction[0];
          var destY = y + direction[1];

          if (wallsFrame.read(destX, destY)) {
            return;
          }

          var player = playersFrame.read(destX, destY);

          if (player) {
            player.health -= missile.energy;

            if (player.health < 1) {
              playersFrame.remove(destX, destY);
            } else {
              player.sensors.missiles = player.sensors.missiles || [];
              var sensor = player.sensors.missiles;
              sensor[missiles.direction] = sensor[missiles.direction] || 0;
              sensor[missiles.direction] += missile.energy;
              playersFrame.write(destX, destY, player);
            }   
          } else {
            var dest = this._frame.read(destX, destY) || [];
            dest.push(missile);
            this._frame.write(destX, destY, dest);
          }
        }
      }.bind(this));
    }.bind(this));
  };

  exports.Missiles = Missiles;

}(window);
