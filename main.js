!function() {

  var DIRECTIONS = [
    [-1, 0], [0, 1], [1, -1], [1, 1],
    [1, 0], [0, -1], [-1, 1], [-1, -1]
  ];

  var STRAIGHT_DIRECTIONS = [
    [-1, 0], [0, 1],
    [1, 0], [0, -1]
  ];

  var wallsFrame = new Frame();
  var wallWavesFrame = new Frame();
  var player = new Player(DIRECTIONS);
  var wallsWave = new Wave('walls', STRAIGHT_DIRECTIONS, 50);
  var playersWave = new Wave('players', DIRECTIONS, 50);
  var missile = new Missile(DIRECTIONS, 5, 50);

  var zoom = 3;
  var viewX = 0;
  var viewY = 0;

  // Set up canvas and context
  var canvas = document.getElementById('universe');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  var ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Used to colorize the walls
  function wallColorizer(player) {
    return 'rgb(200,120,100)';
  }

  // Used to colorize the wall waves
  function wallWaveColorizer(player) {
    return 'rgb(50,40,30)';
  }

  // Used to colorize the player's squares
  function playerColorizer(player) {
    var intensity = 55 + player.health * 2;
    return 'rgb(' + intensity + ',' + intensity + ',' + intensity + ')';
  }

  // Used to colorize the waves squares
  function playerWaveColorizer(wave) {
    return 'rgb(0,60,60)';
  }

  // Used to colorize the missiles squares
  function missileColorizer(missile) {
    return 'rgb(255,200,0)';
  }

  // Renders the frame
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //Renderer.render(ctx, wallsWave.getFrame(), viewX, viewY, zoom, wallWaveColorizer);
    //Renderer.render(ctx, playersWave.getFrame(), viewX, viewY, zoom, playerWaveColorizer);
    Renderer.render(ctx, player.getFrame(), viewX, viewY, zoom, playerColorizer);
    Renderer.render(ctx, missile.getFrame(), viewX, viewY, zoom, missileColorizer);

    Renderer.render(ctx, wallsFrame, viewX, viewY, zoom, wallColorizer);
  }

  for (var i = 0; i < 20; i++) {
    player.add(
      Math.floor(Math.random() * 40) - 20,
      Math.floor(Math.random() * 40) - 20,
      'player-' + (i + 1),
      brain
    );
  }

  for (i = -25; i <= 25; i++) {
    wallsFrame.write(i, 25, true);
    wallsFrame.write(i, -25, true);
    wallsFrame.write(25, i, true);
    wallsFrame.write(-25, i, true);
  }

  for (i = -10; i <= 10; i++) {
    wallsFrame.write(i, 0, true);
  }

  // Main game loop
  var cycle = 0;

  function brain(data) {
    var highestSensorVal;
    var highestSensorDir;
    var lowestSensorVal;
    var lowestSensorDir;

    if (data.sensors.players) {
      for (var i = 0; i < data.sensors.players.length; i++) {
        if (data.sensors.players[i]) {
          if (!highestSensorVal || data.sensors.players[i] > highestSensorVal) {
            highestSensorVal = data.sensors.players[i];
            highestSensorDir = i;
          }
          if (!lowestSensorVal || data.sensors.players[i] > lowestSensorVal) {
            lowestSensorVal = data.sensors.players[i];
            lowestSensorDir = i;
          }
        }
      }
    }

    if (highestSensorVal) {
      if (data.ammo > 0) {
        return Player.fireCommand((highestSensorDir + 4) % 8);
      } else {
        return Player.moveCommand(lowestSensorDir);
      }
    } else if (Math.random() < 0.1) {
      return Player.moveCommand(Math.floor(Math.random() * 8));
    }
  }

  function mainLoop() {

    if (cycle % 20 === 0) {
      wallsFrame.each(function(x, y, wall) {
        wallsWave.emit(x, y, wallsFrame, player.getFrame());
      });
    }

    render();

    for (var i = 0; i < 3; i++) {
      wallsWave.loop(wallsFrame, player.getFrame());
    }

    for (i = 0; i < 3; i++) {
      playersWave.loop(wallsFrame, player.getFrame());
    }

    for (i = 0; i < 2; i++) {
      missile.loop(wallsFrame, player.getFrame());
    }
    
    player.loop(wallsFrame, playersWave, missile);

    setTimeout(window.requestAnimationFrame.bind(window, mainLoop), 50);
    //window.requestAnimationFrame(mainLoop);

    cycle++;
  }

  // Set up user interface and events

  var down, lastX, lastY;

  window.addEventListener('resize', function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    render();
  });

  document.getElementById('zoomOut').addEventListener('click', function() {
    zoom = Math.round(zoom - 1);
  });

  document.getElementById('zoomIn').addEventListener('click', function() {
    zoom = Math.round(zoom + 1);
  });

  canvas.addEventListener('mousedown', function(event) {
    event.preventDefault();
    down = true;
    lastX = event.pageX;
    lastY = event.pageY;
  });

  document.body.addEventListener('mouseup', function(event) {
    event.preventDefault();
    down = false;
  });

  canvas.addEventListener('mousemove', function(event) {
    if (down) {
      event.preventDefault();
      viewX -= event.pageX - lastX;
      viewY -= event.pageY - lastY;
      lastX = event.pageX;
      lastY = event.pageY;
      render();
    }
  });

  canvas.addEventListener('mousewheel', function(event) {
    event.preventDefault();
    var oldCellSize = Math.pow(2, zoom + 1) * 0.5;
    zoom -= event.deltaY / 100;
    var newCellSize = Math.pow(2, zoom + 1) * 0.5;
    var cellSizeRatio = newCellSize / oldCellSize;
    viewX *= cellSizeRatio;
    viewY *= cellSizeRatio;
    render();
  });

  // Start the main loop
  window.requestAnimationFrame(mainLoop);

}();
