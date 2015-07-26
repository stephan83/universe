!function() {

  // Possible movements for each side (currently the same)
  var movements = [
    [[-1,-1],[-2,0],[-1,1],[0,-2],[0,2],[1,-1],[2,0],[1,1]],
    [[-1,-1],[-2,0],[-1,1],[0,-2],[0,2],[1,-1],[2,0],[1,1]],
    [[-1,-1],[-2,0],[-1,1],[0,-2],[0,2],[1,-1],[2,0],[1,1]]
  ];

  // Frame used by the players
  var frame = new Frame();

  // Frame used by the energy source sources
  var energyFrame = new Frame();

  var zoom = 1;
  var viewX = 0;
  var viewY = 0;

  var recycledEnergy = 0;
  var cycle = 0;

  var stats = [
    {count: 0}, {count: 0}, {count: 0}
  ];

  // Set up canvas and context
  var canvas = document.getElementById('universe');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  var ctx = canvas.getContext('2d');

  // Add random players to the frame
  for (var i = 0; i < 1000; i++) {
    var side = Math.floor(Math.random() * 3);

    do {
      var startX = Math.floor(Math.random() * 200) - 100;
      var startY = Math.floor(Math.random() * 100) - 50;
    } while(frame.read(startX, startY));

    var pattern = [];

    for (var j = 0; j < Math.ceil(Math.random() * 200); j++) {
      pattern.push(Math.floor(Math.random() * movements[side].length));
    }

    var data = {
      amp: 500,
      pattern: pattern,
      step: 0,
      side: side,
      startX: startX,
      startY: startY,
      cloneThreshold: Math.floor(Math.random() * 1000),
      inverse: false
    };

    frame.write(startX, startY, data);

    stats[side].count++;
  }

  // Add random energy sources
  for (var i = 0; i < 100; i++) {
    energyFrame.write(
      Math.floor(Math.random() * 300) - 150,
      Math.floor(Math.random() * 200) - 100,
      {
        amp: Math.floor(Math.random() * 100000)
      }
    );
  }

  // Clones a player
  function clone(frame, data, x, y) {
    var pattern = data.pattern.slice();

    for (var i = 0; i < 10; i++) {
      var index = Math.floor(Math.random() * pattern.length);
      pattern[index] = Math.floor(Math.random() *  movements[data.side].length);
    }

    var data = {
      amp: data.cloneThreshold,
      pattern: pattern,
      step: Math.max(0, data.step - 1),
      side: data.side,
      startX: x,
      startY: y,
      cloneThreshold: Math.max(1, data.cloneThreshold - 20 + Math.floor(Math.random() * 20)),
      inverse: Math.random() < 0.1 ? data.inverse : !data.inverse
    };

    frame.write(x, y, data);

    return data;
  }

  // Used to colorize the player's squares
  function colorizer(data) {
    var intensity = Math.min(255, 155 + 200 * (data.amp / 100));
    if (data.side === 2) {
      return 'rgb(' + intensity + ',0,' + intensity + ')';
    }
    if (data.side === 1) {
      return 'rgb(0,' + intensity + ',' + intensity + ')';
    }
    return 'rgb(' + intensity + ',' + intensity + ',0)';
  }

  // Renders the frames
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    Renderer.render(ctx, frame, viewX, viewY, zoom, colorizer);
    EnergyRenderer.render(ctx, energyFrame, viewX, viewY, zoom);
  }

  // Main game loop
  function mainLoop() {
    cycle++;

    // Add lost energy every now and then
    if (recycledEnergy && Math.random() < 0.05) {
      energyFrame.write(
        Math.floor(Math.random() * 300) - 150,
        Math.floor(Math.random() * 200) - 100,
        {
          amp: recycledEnergy
        }
      );
      recycledEnergy = 0;
    }

    render();

    document.getElementById('stats').innerText = 'C: ' + cycle;
    document.getElementById('stats').innerText += '; T: ' + frame.getTotal();
    document.getElementById('stats').innerText += '; Y: ' + stats[0].count;
    document.getElementById('stats').innerText += '; B: ' + stats[1].count;
    document.getElementById('stats').innerText += '; P: ' + stats[2].count;

    if (frame.getTotal() < 1) {
      return;
    }

    // Purple team plays twice
    frame.each(function(x, y, data) {
      if (data.side === 2) {
        innerLoop(x, y, data, true);
      }
    });

    frame.each(function(x, y, data) {
      innerLoop(x, y, data);
    });

    setTimeout(window.requestAnimationFrame.bind(window, mainLoop), 50);
    //window.requestAnimationFrame(mainLoop);
  }

  // Player logic
  function innerLoop(x, y, data, dontDeduce) {
    var step = data.step % data.pattern.length;
    var direction = data.pattern[step];

    if (data.inverse) {
      var targetX = x - movements[data.side][direction][0];
      var targetY = y - movements[data.side][direction][1];
    } else {
      targetX = x + movements[data.side][direction][0];
      targetY = y + movements[data.side][direction][1];
    }

    var target = frame.read(targetX, targetY);
    var destX, destY;

    if (typeof target === 'undefined') {
      // Cell is empty
      destX = targetX;
      destY = targetY;
    } else if (data.side === target.side) {
      // Cell is occupied by ally
      destX = x;
      destY = y;
    } else {
      // Cell is occupied by enemy
      if (data.amp >= target.amp || data.side === 1 && Math.random() < 0.20) {
        // Battle won
        destX = targetX;
        destY = targetY;
        data.amp += target.amp;
        stats[target.side].count--;
      } else {
        // Purple can escape blue
        if (data.side === 2 && target.side === 1 && Math.random() < 0.7) {
          destX = x;
          destY = y;
        } else {
          // Battle lost
          target.amp += data.amp;
          frame.write(targetX, targetY, target);
          stats[data.side].count--;
        }
      }
    }

    frame.remove(x, y);

    if (typeof destX !== 'undefined') {
      var energy = energyFrame.read(destX, destY);

      if (energy) {
        var amount = Math.min(data.side ? 500 : 5000, energy.amp);
        data.amp += amount;
        energy.amp -= amount;
        if (energy.amp > 0) {
          energyFrame.write(destX, destY, energy);
        } else {
          energyFrame.remove(destX, destY);
        }
      }

      data.step++;

      if (!dontDeduce) {
        data.amp -= 1;
      }

      recycledEnergy++;

      if (data.amp < 1) {
        // No more energy :(
        stats[data.side].count--;
        return;
      }

      // Clone if possible
      if (data.amp > data.cloneThreshold * 2 && x !== destX && y !== destY) {
        if (!frame.read(x, y)) {
          data.amp -= data.cloneThreshold;
          clone(frame, data, x, y);
          stats[data.side].count++;
        }
      }

      frame.write(destX, destY, data);
    }
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
