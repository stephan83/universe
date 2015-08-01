var Frame = require('./frame');

var DIRECTIONS = [
  [-1, 0], [0, 1], [1, -1], [1, 1],
  [1, 0], [0, -1], [-1, 1], [-1, -1]
];

function Players() {
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

Players.prototype.setWallsFrame = function(value) {
  this._wallsFrame = value;
};

Players.prototype.setMissiles = function(value) {
  this._missiles = value;
};

Players.prototype.add = function(x, y, team, brain) {
  var id = this._idCount++;

  var player = {
    id: id,
    team: team,
    brain: brain,
    resource: 100,
    ammo: 10,
    sensors: {
      resources: [0, 0, 0, 0, 0, 0, 0, 0],
      allies: [0, 0, 0, 0, 0, 0, 0, 0],
      enemies: [0, 0, 0, 0, 0, 0, 0, 0],
      missiles: [0, 0, 0, 0, 0, 0, 0, 0],
      walls: [0, 0, 0, 0]
    },
    score: 0,
    kills: 0,
    age: 0,
    bestTime: 0
  };

  this._frame.write(x, y, player);

  return player;
};

Players.prototype.move = function(x, y, dir) {
  var player = this._frame.read(x, y);
  var direction = DIRECTIONS[dir];
  var newX = x + direction[0];
  var newY = y + direction[1];

  if (this._wallsFrame.read(newX, newY)) {
    return;
  }

  var existing = this._frame.read(newX, newY);

  if (!existing) {
    this._frame.remove(x, y);
    this._frame.write(newX, newY, player);
  }
};

Players.prototype.fire = function(x, y, dir) {
  var player = this._frame.read(x, y);

  if (player.ammo < this._missiles.getCost()) {
    return;
  }

  player.ammo -= this._missiles.getCost();
  this._frame.write(x, y, player);
  this._missiles.fire(player, x, y, dir, this._wallsFrame, this._frame);
};

Players.prototype.loop = function() {
  this._frame.each(this._loop1, this);
  this._frame.each(this._loop2, this);
};

Players.prototype._loop1 = function(x, y, player) {
  for (var j = 0; j < DIRECTIONS.length; j++) {
    var direction = DIRECTIONS[j];
    for (var i = 1; i < 26; i++) {
      var wall = this._wallsFrame.read(
        x + i * direction[0],
        y + i * direction[1]
      );
      if (wall) {
        break;
      }
      foo = this._frame.read(
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
};

Players.prototype._loop2 = function(x, y, player) {
  player.resource--;
  player.score++;
  player.age++;

  if (player.resource < 1 ||
      player.age >= (1000 + Math.ceil(Math.random() * 10))) {
    this._frame.remove(x, y);
    return;
  }

  var sensors = player.sensors;
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
  
  var command = player.brain.loop(sensors);

  if (command) {
    switch (command.action) {
    case 'move':
      this.move(x, y, command.direction);
      break;
    case 'fire':
      this.fire(x, y, command.direction);
      break;
    }
  }
};

module.exports = Players;
