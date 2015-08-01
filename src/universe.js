var Players = require('./players');
var Missiles = require('./missiles');
var Players = require('./players');
var Renderer = require('./renderer');
var Resources = require('./resources');
var Walls = require('./walls');

var DIRECTIONS = [
  [-1, 0], [0, 1], [1, -1], [1, 1],
  [1, 0], [0, -1], [-1, 1], [-1, -1]
];

var STRAIGHT_DIRECTIONS = [
  [-1, 0], [0, 1],
  [1, 0], [0, -1]
];

var MISSILES_INITIAL_ENERGY = 15;
var MISSILES_COST = 5;

var INITIAL_ZOOM = 2;
var INITIAL_VIEW_X = 0;
var INITIAL_VIEW_Y = 0;

var MAX_FRAME_RATE = 30;
var CYCLE_TIMEOUT = 20;

// Used to colorize the walls
function wallColorizer() {
  return 'rgb(150,150,150)';
}

// Used to colorize the resources
function resourceColorizer() {
  return 'rgb(0,255,20)';
}

// Used to colorize the player's squares
function playerColorizer(player) {
  var intensity = 55 + player.resource * 2;
  if (player.team === 0) {
    return 'rgb(' + intensity + ',0,' + intensity + ')';
  }
  if (player.team === 1) {
    return 'rgb(' + intensity + ',' + intensity + ',0)';
  }
  return 'rgb(0,' + intensity + ',' + intensity + ')';
}

// Used to colorize the missiles squares
function missileColorizer(missiles) {
  var intensity = 55;
  for (var i = 0; i < missiles.length; i++) {
    intensity += missiles[i].energy * 50;
  }
  intensity = Math.min(255, intensity);
  return 'rgb(' + intensity + ',' + Math.round(intensity / 2) + ',0)';
}

function Universe(ctx, map) {
  this._ctx = ctx;

  this._zoom = INITIAL_ZOOM;
  this._viewX = INITIAL_VIEW_X;
  this._viewY = INITIAL_VIEW_Y;
  this._cycleTimeout = CYCLE_TIMEOUT;

  this._teams = [];

  this._cycle = 0;
  this._lastRenderTime = 0;

  this._walls = new Walls();
  this._resources = new Resources();
  this._players = new Players();
  this._missiles = new Missiles(
    DIRECTIONS,
    MISSILES_COST,
    MISSILES_INITIAL_ENERGY
  );

  this._walls.setPlayersFrame(this._players.getFrame());
  this._resources.setPlayersFrame(this._players.getFrame());
  this._resources.setWallsFrame(this._walls.getFrame());
  this._resources.setAddResource(this.addResource.bind(this));
  this._players.setWallsFrame(this._walls.getFrame());
  this._players.setMissiles(this._missiles);
  this._missiles.setPlayers(this._players);
  this._missiles.setWallsFrame(this._walls.getFrame());

  this._floor = [];
  this._initMap(map);
}

Universe.prototype.getZoom = function() {
  return this._zoom;
};

Universe.prototype.setZoom = function(value) {
  this._zoom = value;
};

Universe.prototype.getViewX = function() {
  return this._viewX;
};

Universe.prototype.setViewX = function(value) {
  this._viewX = value;
};

Universe.prototype.getViewY = function() {
  return this._viewY;
};

Universe.prototype.setViewY = function(value) {
  this._viewY = value;
};

Universe.prototype.getCycleTimeout = function() {
  return this._cycleTimeout;
};

Universe.prototype.setCycleTimeout = function(value) {
  this._cycleTimeout = Math.max(0, value);
};

Universe.prototype.getCycle = function() {
  return this._cycle;
};

Universe.prototype.getTeams = function() {
  return this._teams;
};

Universe.prototype.getTotalPlayers = function() {
  return this._players.getFrame().getTotal();
};

Universe.prototype.start = function() {
  window.requestAnimationFrame(this._mainLoop.bind(this));
};

// Force a render
Universe.prototype.render = function() {
  this._ctx.clearRect(0, 0, this._ctx.canvas.width, this._ctx.canvas.height);
  Renderer.render(
    this._ctx,
    this._walls.getFrame(),
    this._viewX,
    this._viewY,
    this._zoom,
    wallColorizer
  );
  Renderer.render(
    this._ctx,
    this._resources.getFrame(),
    this._viewX,
    this._viewY,
    this._zoom,
    resourceColorizer
  );
  Renderer.render(
    this._ctx,
    this._players.getFrame(),
    this._viewX,
    this._viewY,
    this._zoom,
    playerColorizer
  );
  Renderer.render(
    this._ctx,
    this._missiles.getFrame(),
    this._viewX,
    this._viewY,
    this._zoom,
    missileColorizer
  );
};

Universe.prototype.addResource = function(amount) {
  do {
    var rand = Math.floor(Math.random() * this._floor.length);
    var cell = this._floor[rand];
    var x = cell[0];
    var y = cell[1];
  } while(this._resources.getFrame().read(x, y) ||
          this._players.getFrame().read(x, y))
  this._resources.add(x, y, amount);
};

Universe.prototype.addTeam = function(name, brain, size, bestSize, maxBestTime, newRate, mateRate) {
  this._teams.push({
    name: name,
    brain: brain,
    size: size,
    bestSize: bestSize,
    maxBestTime: maxBestTime,
    newRate: newRate,
    mateRate: mateRate,
    score: 0,
    players: [],
    best: []
  });
};

Universe.moveCommand = Players.moveCommand;
Universe.fireCommand = Players.fireCommand;

Universe.prototype._initMap = function(map) {
  var width = 0;
  map.forEach(function(row, y) {
    width = Math.max(width, row.length);
  });

  map.forEach(function(row, y) {
    y -= Math.floor(map.length / 2);
    row.split('').forEach(function(cell, x) {
      x -= Math.floor(width / 2);
      switch (cell) {
      case 'x':
        this._walls.add(x, y);
        break;
      case '.':
        this._floor.push([x, y]);
        break;
      }
    }.bind(this));
  }.bind(this));
};

Universe.prototype._logic = function() {
  this._walls.loop(this._players.getFrame());
  this._resources.loop();
  for (i = 0; i < 2; i++) {
    this._missiles.loop();
  }
  this._players.loop();

  this._teams.forEach(function(team) {
    team.score = 0;
    team.players = [];
    var cycle = this._cycle;
    team.best = team.best.filter(function(player) {
      return player.bestTime >= cycle - team.maxBestTime;
    });
  }.bind(this));

  this._players.getFrame().each(function(x, y, player) {
    var team = this._teams[player.team];
    team.players.push(player);
    team.score += player.score;
    for (var i = 0; i < team.best.length; i++) {
      if (player.id === team.best[i].id) {
        team.best.splice(i, 1);
        break;
      }
    }
    for (i = 0; i < team.best.length; i++) {
      if (player.score >= team.best[i].score) {
        break;
      }
    }
    player.bestTime = this._cycle;
    team.best.splice(i, 0, player);
    if (team.best.length > 5) {
      team.best.pop();
    }
  }.bind(this));

  this._teams.forEach(function(team, index) {
    while (team.players.length < team.size) {
      if (Math.random() < team.newRate) {
        var brain = new team.brain();
      } else if (team.best.length > 1) {
        var brain1 = team.best[Math.floor(Math.random() * team.best.length)].brain;
        do {
          var brain2 = team.best[Math.floor(Math.random() * team.best.length)].brain;
        } while (brain1 !== brain2)
        if (Math.random() < team.mateRate) {
          brain = brain1.mate(brain2);
        } else {
          brain = brain1.mutate();
        }
      }
      this._addPlayer(index, brain || new team.brain());
    }
    team.players.sort(function(a, b) {
      return b.score - a.score;
    });
  }.bind(this));

  this._cycle++;
  this.onLogic && this.onLogic();
};

Universe.prototype._mainLoop = function() {
  var now = Date.now();

  if (now > this._lastRenderTime + 1000 / MAX_FRAME_RATE) {
    this._lastRenderTime = now;
    this.render();
  }

  this._logic();

  if (this._cycleTimeout) {
    setTimeout(
      window.requestAnimationFrame.bind(window, this._mainLoop.bind(this))
      , this._cycleTimeout
    );
  } else {
    window.requestAnimationFrame(this._mainLoop.bind(this));
  }
};

Universe.prototype._addPlayer = function(team, brain) {
  do {
    var rand = Math.floor(Math.random() * this._floor.length);
    var cell = this._floor[rand];
    var x = cell[0];
    var y = cell[1];
  } while(this._resources.getFrame().read(x, y) ||
          this._players.getFrame().read(x, y))
  this._teams[team].players.push(this._players.add(x, y, team, brain));
};

module.exports = Universe;
