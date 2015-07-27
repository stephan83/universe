!function(exports) {

  function Player(directions) {
    this._directions = directions;
    this._frame = new Frame();
  }

  Player.moveCommand = function(dir) {
    return {action: 'move', direction: dir};
  };

  Player.fireCommand = function(dir) {
    return {action: 'fire', direction: dir};
  };

  Player.prototype.getFrame = function() {
    return this._frame;
  };

  Player.prototype.add = function(x, y, name, brain) {
    this._frame.write(x, y, {
      name: name,
      health: 100,
      ammo: 10,
      sensors: {},
      brain: brain
    });
  };

  Player.prototype.move = function(x, y, dir, wallsFrame, playersWave) {
    var player = this._frame.read(x, y);
    var direction = this._directions[dir];
    var newX = x + direction[0];
    var newY = y + direction[1];

    if (wallsFrame.read(newX, newY)) {
      return;
    }

    var existing = this._frame.read(newX, newY);

    if (!existing) {
      this._frame.remove(x, y);
      this._frame.write(newX, newY, player);
      playersWave.emit(newX, newY, wallsFrame);
    }
  };

  Player.prototype.fire = function(x, y, dir, wallsFrame, missile, playersWave) {
    var player = this._frame.read(x, y);
    player.ammo -= missile.getCost();
    this._frame.write(x, y, player);
    missile.fire(player, x, y, dir, wallsFrame, this._frame);
  };

  Player.prototype.loop = function(wallsFrame, playersWave, missile) {
    this._frame.each(function(x, y, player) {
      var sensors = player.sensors;
      player.ammo = Math.min(10, player.ammo + 1);
      player.sensors = {};
      this._frame.write(x, y, player);
      
      var command = player.brain({
        health: player.health,
        ammo: player.ammo,
        sensors: sensors
      });

      if (command) {
        switch (command.action) {
        case 'move':
          this.move(x, y, command.direction, wallsFrame, playersWave);
          break;
        case 'fire':
          this.fire(x, y, command.direction, wallsFrame, missile, playersWave);
          break;
        }
      }
    }.bind(this));
  };

  exports.Player = Player;

}(window);
