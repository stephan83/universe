!function(exports) {

  function Players(directions) {
    this._directions = directions;
    this._frame = new Frame();
    this._lostEnergy = 0;
    this._idCount = 0;
  }

  Players.moveCommand = function(dir) {
    return {action: 'move', direction: dir};
  };

  Players.fireCommand = function(dir) {
    return {action: 'fire', direction: dir};
  };

  Players.prototype.getFrame = function() {
    return this._frame;
  };

  Players.prototype.getLostEnergy = function() {
    return this._lostEnergy;
  };

  Players.prototype.incrLostEnergy = function(value) {
    this._lostEnergy += value;
  };

  Players.prototype.resetLostEnergy = function() {
    this._lostEnergy = 0;
  };

  Players.prototype.add = function(x, y, name, ai) {
    var id = this._idCount++;

    this._frame.write(x, y, {
      name: name,
      resource: 100,
      ammo: 10,
      sensors: {},
      ai: ai,
      age: 0,
      id: id
    });

    return id;
  };

  Players.prototype.move = function(x, y, dir, wallsFrame, playersWave) {
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

  Players.prototype.fire = function(x, y, dir, wallsFrame, missile, playersWave) {
    var player = this._frame.read(x, y);

    if (player.ammo < missile.getCost()) {
      return;
    }

    player.ammo -= missile.getCost();
    this._frame.write(x, y, player);
    missile.fire(player, x, y, dir, wallsFrame, this._frame);
  };

  Players.prototype.loop = function(wallsFrame, playersWave, missile, scores) {
    this._frame.each(function(x, y, player) {
      player.resource--;
      this._lostEnergy++;
      scores[player.id] = scores[player.id] || 0;
      scores[player.id]++;

      if (player.resource < 1) {
        this._frame.remove(x, y);
        return;
      }

      var sensors = player.sensors;
      player.age++;
      player.ammo = Math.min(10, player.ammo + 1);
      player.sensors = {};
      this._frame.write(x, y, player);

      sensors.resource = player.resource;
      sensors.ammo = player.ammo;
      
      var command = player.ai.loop(sensors);

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

  exports.Players = Players;

}(window);
