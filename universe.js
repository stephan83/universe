!function(exports) {

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

  var INITIAL_ZOOM = 3;
  var INITIAL_VIEW_X = 0;
  var INITIAL_VIEW_Y = 0;

  var MAX_FRAME_RATE = 30;
  var MAIN_LOOP_TIMEOUT = 0;

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
    if (player.ai instanceof Brains.One) {
      return 'rgb(' + intensity + ',0,' + intensity + ')';
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

    this._walls = new Walls(1);
    this._resources = new Resources(1);
    this._players = new Players(DIRECTIONS);
    this._missiles = new Missiles(
      DIRECTIONS,
      MISSILES_COST,
      MISSILES_INITIAL_ENERGY
    );

    this._zoom = INITIAL_ZOOM;
    this._viewX = INITIAL_VIEW_X;
    this._viewY = INITIAL_VIEW_Y;

    this._scores = {};
    this._aiMap = {};

    this._cycle = 0;
    this._lastRenderTime = 0;

    this._floor = [];
    this._initMap(map);
  }

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

    this._resources.loop(this._players.getFrame(), this.addResource.bind(this));

    for (i = 0; i < 2; i++) {
      this._missiles.loop(this._walls.getFrame(), this._players, this._scores);
    }
    
    this._players.loop(
      this._walls.getFrame(),
      this._missiles,
      this._scores
    );

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

    if (MAIN_LOOP_TIMEOUT) {
      setTimeout(
        window.requestAnimationFrame.bind(window, this._mainLoop.bind(this))
        , MAIN_LOOP_TIMEOUT
      );
    } else {
      window.requestAnimationFrame(this._mainLoop.bind(this));
    }
  };

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

  Universe.prototype.getCycle = function() {
    return this._cycle;
  };

  Universe.prototype.getScores = function() {
    return this._scores;
  };

  Universe.prototype.getAi = function(id) {
    return this._aiMap[id];
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

  Universe.prototype.addPlayer = function(name, ai) {
    do {
      var rand = Math.floor(Math.random() * this._floor.length);
      var cell = this._floor[rand];
      var x = cell[0];
      var y = cell[1];
    } while(this._players.getFrame().read(x, y))
    this._aiMap[this._players.add(x, y, name, ai)] = ai;
  };

  Universe.moveCommand = Players.moveCommand;
  Universe.fireCommand = Players.fireCommand;

  exports.Universe = Universe;

}(window);
