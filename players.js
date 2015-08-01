!function(exports) {

  var DIRECTIONS = [
    [-1, 0], [0, 1], [1, -1], [1, 1],
    [1, 0], [0, -1], [-1, 1], [-1, -1]
  ];

  function Players(directions) {
    this._directions = directions;
    this._frame = new Frame();
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

  Players.prototype.add = function(x, y, team, ai) {
    var id = this._idCount++;

    this._frame.write(x, y, {
      team: team,
      resource: 100,
      ammo: 10,
      sensors: {
        resources: [0, 0, 0, 0, 0, 0, 0, 0],
        allies: [0, 0, 0, 0, 0, 0, 0, 0],
        enemies: [0, 0, 0, 0, 0, 0, 0, 0],
        missiles: [0, 0, 0, 0, 0, 0, 0, 0],
        walls: [0, 0, 0, 0]
      },
      ai: ai,
      age: 0,
      id: id
    });

    return id;
  };

  Players.prototype.move = function(x, y, dir, wallsFrame) {
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

  Players.prototype.loop = function(wallsFrame, missile, scores) {
    var frame = this._frame;

    this._frame.each(function(x, y, player) {
      for (var j = 0; j < DIRECTIONS.length; j++) {
        var direction = DIRECTIONS[j];
        for (var i = 1; i < 26; i++) {
          var wall = wallsFrame.read(
            x + i * direction[0],
            y + i * direction[1]
          );
          if (wall) {
            break;
          }
          foo = frame.read(
            x + i * direction[0],
            y + i * direction[1]
          );
          if (foo) {
            if (foo.team === player.team) {
              player.sensors.allies[j] += 26 - i;
            } else {
              player.sensors.enemies[j] += 26 - i;
            }
          }
        }
      }
    });

    this._frame.each(function(x, y, player) {
      player.resource--;
      scores[player.id] = scores[player.id] || 0;
      scores[player.id]++;

      if (player.resource < 1 || player.age >= (1000 + Math.ceil(Math.random() * 10))) {
        this._frame.remove(x, y);
        return;
      }

      var sensors = player.sensors;
      player.age++;
      player.ammo = Math.min(10, player.ammo + 1);
      player.sensors = {
        resources: [0, 0, 0, 0, 0, 0, 0, 0],
        allies: [0, 0, 0, 0, 0, 0, 0, 0],
        enemies: [0, 0, 0, 0, 0, 0, 0, 0],
        missiles: [0, 0, 0, 0, 0, 0, 0, 0],
        walls: [0, 0, 0, 0]
      };
      this._frame.write(x, y, player);

      sensors.resource = player.resource;
      sensors.ammo = player.ammo;
      
      var command = player.ai.loop(sensors);

      if (command) {
        switch (command.action) {
        case 'move':
          this.move(x, y, command.direction, wallsFrame);
          break;
        case 'fire':
          this.fire(x, y, command.direction, wallsFrame, missile);
          break;
        }
      }
    }.bind(this));
  };

  exports.Players = Players;

}(window);
