!function() {

  var DIRECTIONS = [
    [-1, 0],
    [0, 1],
    [1, -1],
    [1, 1],
    [1, 0],
    [0, -1],
    [-1, 1],
    [-1, -1]
  ];

  var wallsFrame = new Frame();
  var playersFrame = new Frame();
  var wavesFrame = new Frame();
  var missilesFrame = new Frame();

  var zoom = 2;
  var viewX = 0;
  var viewY = 0;

  // Set up canvas and context
  var canvas = document.getElementById('universe');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  var ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Used to colorize the walls
  function wallsColorizer(player) {
    return 'rgb(200,120,100)';
  }

  // Used to colorize the player's squares
  function playersColorizer(player) {
    return 'rgb(255,255,255)';
  }

  // Used to colorize the waves squares
  function wavesColorizer(wave) {
    return 'rgb(0,60,60)';
  }

  // Used to colorize the missiles squares
  function missilesColorizer(missile) {
    return 'rgb(255,200,0)';
  }

  // Renders the frame
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    Renderer.render(ctx, wallsFrame, viewX, viewY, zoom, wallsColorizer);
    Renderer.render(ctx, wavesFrame, viewX, viewY, zoom, wavesColorizer);
    Renderer.render(ctx, playersFrame, viewX, viewY, zoom, playersColorizer);
    Renderer.render(ctx, missilesFrame, viewX, viewY, zoom, missilesColorizer);
  }

  for (var i = 0; i < 200; i++) {
    playersFrame.write(
      Math.floor(Math.random() * 180) - 90,
      Math.floor(Math.random() * 180) - 90,
      {
        name: 'Player ' + (i + 1),
        health: 100,
        ammo: 10,
        waveSensors: {
          waves: [0,0,0,0,0,0,0,0],
          missileSensors: [0,0,0,0,0,0,0,0]
        }
      }
    );
  }

  for (i = -100; i <= 100; i++) {
    wallsFrame.write(i, 100, true);
    wallsFrame.write(i, -100, true);
    wallsFrame.write(100, i, true);
    wallsFrame.write(-100, i, true);
  }

  function emitWave(player, x, y) {
    var initialWaveEnergy = 100;
    for (var i = 0; i < DIRECTIONS.length; i++) {
      var direction = DIRECTIONS[i];
      var startX = x + direction[0];
      var startY = y + direction[1];

      if (wallsFrame.read(startX, startY)) {
        return;
      }

      wavesFrame.write(startX, startY, {
        emitter: player.name,
        direction: i,
        energy: initialWaveEnergy
      });
    }
  }

  function movePlayer(player, x, y, dir) {
    var direction = DIRECTIONS[dir];
    var newX = x + direction[0];
    var newY = y + direction[1];

    if (wallsFrame.read(newX, newY)) {
      return;
    }

    var existing = playersFrame.read(newY, newY);

    if (!existing) {
      playersFrame.remove(x, y);
      playersFrame.write(newX, newY, player);
      emitWave(player, newX, newY);
    }
  }

  function fireMissile(player, x, y, dir) {
    var initialMissilesEnergy = 100;

    var direction = DIRECTIONS[dir];
    var startX = x + direction[0];
    var startY = y + direction[1];

    if (wallsFrame.read(startX, startY)) {
      return;
    }

    player.ammo -= 5;
    playersFrame.write(x, y, player);

    var existing = missilesFrame.read(startY, startY);

    if (existing) {
      missilesFrame.remove(startX, startY);
    } else {
      missilesFrame.write(startX, startY, {
        direction: dir,
        energy: initialMissilesEnergy
      });
      emitWave(player, startX, startY);
    }
  }

  // Main game loop
  function mainLoop() {
    render();

    for (var i = 0; i < 3; i++) {
      wavesFrame.each(function(x, y, wave) {
        wavesFrame.remove(x, y);

        wave.energy--;

        if (wave.energy > 0) {
          var direction = DIRECTIONS[wave.direction];
          var newX = x + direction[0];
          var newY = y + direction[1];

          if (wallsFrame.read(newX, newY)) {
            return;
          }

          var existing = wavesFrame.read(newY, newY);

          if (!existing || wave.energy >= existing.energy) {
            var player = playersFrame.read(newX, newY);

            if (player && player.name != wave.emitter) {
              player.waveSensors[wave.direction] += wave.energy;
              playersFrame.write(newX, newY, player);
            } else {
              wavesFrame.write(newX, newY, wave);
            }
          }
        }
      });
    }

    for (i = 0; i < 2; i++) {
      missilesFrame.each(function(x, y, missile) {
        missilesFrame.remove(x, y);

        missile.energy--;

        if (missile.energy > 0) {
          var direction = DIRECTIONS[missile.direction];
          var newX = x + direction[0];
          var newY = y + direction[1];

          if (wallsFrame.read(newX, newY)) {
            return;
          }

          var existing = missilesFrame.read(newY, newY);

          if (!existing || missile.energy >= existing.energy) {
            var player = playersFrame.read(newX, newY);

            if (player) {
              player.health -= missile.energy;

              if (player.health < 0) {
                playersFrame.remove(newX, newY);
              } else {
                player.missileSensors[missile.direction] += missile.energy;
                playersFrame.write(newX, newY, player);
              }
            } else {
              missilesFrame.write(newX, newY, missile);
            }
          }
        }
      });
    }
    
    playersFrame.each(function(x, y, player) {
      var highestSensorVal;
      var highestSensorDir;
      var lowestSensorVal;
      var lowestSensorDir;

      for (var i = 0; i < player.waveSensors.length; i++) {
        if (!highestSensorVal || player.waveSensors[i] > highestSensorVal) {
          highestSensorVal = player.waveSensors[i];
          highestSensorDir = i;
        }
        if (!lowestSensorVal || player.waveSensors[i] > lowestSensorVal) {
          lowestSensorVal = player.waveSensors[i];
          lowestSensorDir = i;
        }
      }

      player.waveSensors = [0,0,0,0,0,0,0,0];
      player.missileSensors = [0,0,0,0,0,0,0,0];
      player.ammo = Math.min(10, player.ammo + 1);
      playersFrame.write(x, y, player);

      if (highestSensorVal) {
        if (player.ammo > 0) {
          var dir = (highestSensorDir + 4) % 8;
          fireMissile(player, x, y, dir);
        } else {
          dir = (lowestSensorDir + 4) % 8;
          movePlayer(player, x, y, dir);
        }
      } else if (Math.random() < 0.1) {
        movePlayer(player, x, y, Math.floor(Math.random() * 8));
      }
    });

    setTimeout(window.requestAnimationFrame.bind(window, mainLoop), 50);
    //window.requestAnimationFrame(mainLoop);
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
