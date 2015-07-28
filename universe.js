!function(exports) {

  var DIRECTIONS = [
    [-1, 0], [0, 1], [1, -1], [1, 1],
    [1, 0], [0, -1], [-1, 1], [-1, -1]
  ];

  var STRAIGHT_DIRECTIONS = [
    [-1, 0], [0, 1],
    [1, 0], [0, -1]
  ];

  var WALL_WAVES_INITIAL_ENERGY = 50;
  var RESOURCE_WAVES_INITIAL_ENERGY = 50;
  var PLAYER_WAVES_INITIAL_ENERGY = 50;
  var MISSILES_INITIAL_ENERGY = 50;
  var MISSILES_COST = 10;

  var INITIAL_ZOOM = 3;
  var INITIAL_VIEW_X = 0;
  var INITIAL_VIEW_Y = 0;

  var MAIN_LOOP_TIMEOUT = 50;

  // Used to colorize the walls
  function wallColorizer() {
    return 'rgb(200,120,100)';
  }

  // Used to colorize the wall waves
  function wallWaveColorizer() {
    return 'rgb(50,40,30)';
  }

  // Used to colorize the resources
  function resourceColorizer() {
    return 'rgb(0,255,20)';
  }

  // Used to colorize the resource waves
  function resourceWaveColorizer() {
    return 'rgb(0,50,10)';
  }

  // Used to colorize the player's squares
  function playerColorizer(player) {
    var intensity = 55 + player.resource * 2;
    return 'rgb(' + intensity + ',' + intensity + ',' + intensity + ')';
  }

  // Used to colorize the waves squares
  function playerWaveColorizer() {
    return 'rgb(0,60,60)';
  }

  // Used to colorize the missiles squares
  function missileColorizer(missiles) {
    var intensity = 55;
    for (var i = 0; i < missiles.length; i++) {
      intensity += missiles[i].energy * 4;
    }
    intensity = Math.min(255, intensity);
    return 'rgb(' + intensity + ',' + Math.round(intensity / 2) + ',0)';
  }

  function Universe(ctx) {
    this._ctx = ctx;

    this._walls = new Walls(20);
    this._resources = new Resources(3);
    this._players = new Players(DIRECTIONS);
    this._wallWaves = new Waves(
      'walls',
      STRAIGHT_DIRECTIONS,
      WALL_WAVES_INITIAL_ENERGY
    );
    this._resourceWaves = new Waves(
      'resources',
      DIRECTIONS,
      RESOURCE_WAVES_INITIAL_ENERGY
    );
    this._playerWaves = new Waves(
      'players', DIRECTIONS,
      PLAYER_WAVES_INITIAL_ENERGY
    );
    this._missiles = new Missiles(
      DIRECTIONS,
      MISSILES_COST,
      MISSILES_INITIAL_ENERGY
    );

    this._zoom = INITIAL_ZOOM;
    this._viewX = INITIAL_VIEW_X;
    this._viewY = INITIAL_VIEW_Y;

    this._cycle = 0;
  }

  Universe.prototype._logic = function() {
    var lostEnergy = this._players.getLostEnergy();

    // tmp
    if(lostEnergy > 50) {
      this.addResource(
        Math.floor(Math.random() * 40) - 20,
        Math.floor(Math.random() * 40) - 20,
        lostEnergy
      );
      this._players.resetLostEnergy();
    }

    this._walls.loop(this._wallWaves);
    this._resources.loop(this._resourceWaves, this._players.getFrame());

    for (var i = 0; i < 3; i++) {
      this._wallWaves.loop(this._walls.getFrame(), this._players.getFrame());
    }

    for (i = 0; i < 3; i++) {
      this._resourceWaves.loop(
        this._walls.getFrame(),
        this._players.getFrame()
      );
    }

    for (i = 0; i < 3; i++) {
      this._playerWaves.loop(this._walls.getFrame(), this._players.getFrame());
    }

    for (i = 0; i < 2; i++) {
      this._missiles.loop(this._walls.getFrame(), this._players);
    }
    
    this._players.loop(
      this._walls.getFrame(),
      this._playerWaves,
      this._missiles
    );

    this._cycle++;

    this.onLogic && this.onLogic();
  };

  Universe.prototype._mainLoop = function() {
    this.render();
    this._logic();

    setTimeout(
      window.requestAnimationFrame.bind(window, this._mainLoop.bind(this))
      , MAIN_LOOP_TIMEOUT
    );

    //window.requestAnimationFrame(this._mainLoop.bind(this));
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

  Universe.prototype.addWall = function(x, y) {
    this._walls.add(x, y);
  };

  Universe.prototype.addResource = function(x, y, amount) {
    this._resources.add(x, y, amount);
  };

  Universe.prototype.addPlayer = function(x, y, name, ai) {
    this._players.add(x, y, name, ai);
  };

  Universe.moveCommand = Players.moveCommand;
  Universe.fireCommand = Players.fireCommand;

  exports.Universe = Universe;

}(window);
