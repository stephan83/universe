var Frame = require('./frame');

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

Missiles.prototype.setWallsFrame = function(value) {
  this._wallsFrame = value;
};

Missiles.prototype.setPlayers = function(value) {
  this._players = value;
};

Missiles.prototype.fire = function(player, x, y, dir) {
  var direction = this._directions[dir];
  var startX = x + direction[0];
  var startY = y + direction[1];

  if (this._wallsFrame.read(startX, startY)) {
    return;
  }

  var missiles = this._frame.read(startX, startY) || [];

  missiles.push({
    direction: dir,
    energy: this._initialEnergy,
    emitter: player
  });

  this._frame.write(startX, startY, missiles);
};

Missiles.prototype.loop = function() {
  var previous = this._frame;
  this._frame = new Frame();

  previous.each(function(x, y, missiles) {
    missiles.forEach(function(missile) {
      missile.energy--;

      if (missile.energy > 0) {
        var direction = this._directions[missile.direction];
        var destX = x + direction[0];
        var destY = y + direction[1];

        if (this._wallsFrame.read(destX, destY)) {
          return;
        }

        var player = this._players.getFrame().read(destX, destY);

        if (player) {
          player.resource -= missile.energy;

          if (missile.emitter.team === player.team) {
            missile.emitter.score = Math.max(0, missile.emitter.score - missile.energy);
          } else {
            missile.emitter.score += missile.energy;
          }

          if (player.resource < 1) {
            this._players.getFrame().remove(destX, destY);
          } else {
            var sensor = player.sensors.missiles;
            sensor[(missiles.direction + 4) % 8] += missile.energy;
            this._players.getFrame().write(destX, destY, player);
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

module.exports = Missiles;
