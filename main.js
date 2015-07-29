!function() {

  var NUM_PLAYERS = 4;
  var NUM_LESS = 4;
  var NUM_BEST = 5;
  var BEST_EXPIRES = 10000;

  var canvas = document.getElementById('universe');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  var ctx = canvas.getContext('2d');
  var universe = new Universe(ctx);

  // Create walls
  for (var i = -30; i <= 30; i++) {
    universe.addWall(i, 30);
    universe.addWall(i, -30);
    universe.addWall(30, i);
    universe.addWall(-30, i);
  }

  // Add random players
  for (i = 0; i < NUM_PLAYERS; i++) {
    universe.addPlayer(
      Math.floor(Math.random() * 40) - 20,
      Math.floor(Math.random() * 40) - 20,
      'player',
      new Brains.One()
    );
  }
  for (i = 0; i < NUM_LESS; i++) {
    universe.addPlayer(
      Math.floor(Math.random() * 40) - 20,
      Math.floor(Math.random() * 40) - 20,
      'player',
      new Brains.Less()
    );
  }

  // Add random resources
  for (i = 0; i < NUM_PLAYERS + NUM_LESS; i++) {
    universe.addResource(
      Math.floor(Math.random() * 40) - 20,
      Math.floor(Math.random() * 40) - 20,
      50 + Math.floor(Math.random() * 50)
    );
  }

  var lastTime;
  var lastCycle;
  var stats = document.getElementById('stats');
  var best = [];

  universe.onLogic = function() {
    var scores = universe.getScores();  
    var oneScore = 0;
    var lessScore = 0;
    var alive = [];
    var aliveOne = 0;

    var now = Date.now();
    var cycle = universe.getCycle();

    if (lastTime) {
      var ellapsed = now - lastTime;
      var cyclesPerSecond = 1000 * (cycle - lastCycle) / ellapsed;
    }

    lastTime = now;
    lastCycle = cycle;

    universe._players.getFrame().each(function(x, y, player) {
      var score = scores[player.id];
      var ai = universe.getAi(player.id);
      var data = {
        id: player.id,
        score: score,
        ai: ai,
        time: universe.getCycle(),
        one: ai instanceof Brains.One
      };
      alive.push(data);
      if (ai instanceof Brains.One) {
        aliveOne++;
        oneScore += score;
        for (var i = 0; i < best.length; i++) {
          if (player.id === best[i].id) {
            best.splice(i, 1);
            break;
          }
        }
        for (var i = 0; i < best.length; i++) {
          if (score >= best[i].score) {
            break;
          }
        }
        best.splice(i, 0, data);
        if (best.length > NUM_BEST) {
          best.pop();
        }
      } else { 
        lessScore += score;
      }
    });

    best = best.filter(function(data) {
      return data.time > universe.getCycle() - BEST_EXPIRES;
    });

    if (universe.getCycle() % 10 === 0 || universe.getCycle() === 1) {
      alive.sort(function(a, b) {
        return b.score - a.score;
      });

      var html = '<div>C: ' + cycle + '; CPS: ' + (cyclesPerSecond ? cyclesPerSecond.toFixed(0) : '-') +  '</div>';

      html += '<div>-------------------------------</div>';

      for (var i = 0; i < best.length; i++) {
        html += '<div>S: ' + best[i].score + '; T: ' + best[i].time + '; ID: ' + best[i].id + '</div>';
      }

      html += '<div>-------------------------------</div>';

      html += '<div>O: ' + oneScore + ', L: ' + lessScore + '; R: ' + (oneScore / lessScore).toFixed(2) + '</div>';

      for (var i = 0; i < alive.length; i++) {
        html += '<div>S: ' + alive[i].score + '; ONE: ' + alive[i].one + '; ID: ' + alive[i].id + '</div>';
      }

      stats.innerHTML = html;
    }

    for (i = 0; i < NUM_PLAYERS + NUM_LESS - alive.length; i++) {
      do {
        var x = Math.floor(Math.random() * 40) - 20;
        var y = Math.floor(Math.random() * 40) - 20;
      } while(universe._players.getFrame().read(x, y));

      if (aliveOne < NUM_PLAYERS) {
        aliveOne++;
        if (best.length) {
          var ai = best[Math.floor(Math.random() * best.length)].ai;
        } else {
          ai = null;
        }
        universe.addPlayer(
          x,
          y,
          'player',
          (Math.random() < 0.8 && ai) ? ai.clone() : new Brains.One()
        );
      } else {
        universe.addPlayer(
          x,
          y,
          'player',
          new Brains.Less()
        );
      }
    }
  };

  // Set up user interface and events

  var down, lastX, lastY;

  window.addEventListener('resize', function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    universe.render();
  });

  document.getElementById('zoomOut').addEventListener('click', function() {
    universe.setZoom(Math.round(universe.getZoom() - 1));
    universe.render();
  });

  document.getElementById('zoomIn').addEventListener('click', function() {
    universe.setZoom(Math.round(universe.getZoom() + 1));
    universe.render();
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
      universe.setViewX(universe.getViewX() - event.pageX + lastX);
      universe.setViewY(universe.getViewY() - event.pageY + lastY);
      universe.render();
      lastX = event.pageX;
      lastY = event.pageY;
    }
  });

  canvas.addEventListener('mousewheel', function(event) {
    event.preventDefault();
    var oldCellSize = Math.pow(2, universe.getZoom() + 1) * 0.5;
    universe.setZoom(universe.getZoom() - event.deltaY / 100);
    var newCellSize = Math.pow(2, universe.getZoom() + 1) * 0.5;
    var cellSizeRatio = newCellSize / oldCellSize;
    universe.setViewX(universe.getViewX() * cellSizeRatio);
    universe.setViewY(universe.getViewY() * cellSizeRatio);
    universe.render();
  });

  // Boot

  universe.start();

  window.universe = universe;

}();
