!function() {

  var NUM_PLAYERS = 20;
  var NUM_BEST = 4;

  var canvas = document.getElementById('universe');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  var ctx = canvas.getContext('2d');
  var universe = new Universe(ctx);

  // Create walls
  for (i = -30; i <= 30; i++) {
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

  // Add random resources
  for (var i = 0; i < 20; i++) {
    universe.addResource(
      Math.floor(Math.random() * 40) - 20,
      Math.floor(Math.random() * 40) - 20,
      50 + Math.floor(Math.random() * 50)
    );
  }

  var stats = document.getElementById('stats');
  var best = [];

  universe.onLogic = function() {
    var scores = universe.getScores();  
    var totalScore = 0;
    var alive = [];

    universe._players.getFrame().each(function(x, y, player) {
      var score = scores[player.id];
      totalScore += score;
      var data = {
        id: player.id,
        score: score,
        ai: universe.getAi(player.id)
      };
      alive.push(data);
      for (var i = 0; i < best.length; i++) {
        if (best[i].id === player.id) {
          best.slice(i, 1);
          break;
        }
      }
      if (best.length < NUM_BEST) {
        best.push(data);
      } else {
        for (var i = 0; i < best.length; i++) {
          if (score >= player.id) {
            best.splice(i, 0, data);
            best.pop();
            break;
          }
        }
      }
    });

    if (universe.getCycle() % 10 === 0 || universe.getCycle() === 1) {
      alive.sort(function(a, b) {
        return b.score - a.score;
      });

      var html = '<div>C: ' + universe.getCycle() + '</div>';

      html += '<div>T: ' + totalScore + '</div>';

      for (var i = 0; i < alive.length; i++) {
        html += '<div>S: ' + alive[i].score + '; ID: ' + alive[i].id + '</div>';
      }

      stats.innerHTML = html;
    }

    for (i = 0; i < NUM_PLAYERS - alive.length; i++) {
      if (best.length) {
        var ai = best[Math.floor(Math.random() * best.length)].ai;
      } else {
        ai = null;
      }
      do {
        var x = Math.floor(Math.random() * 40) - 20;
        var y = Math.floor(Math.random() * 40) - 20;
      } while(universe._players.getFrame().read(x, y));
      universe.addPlayer(
        x,
        y,
        'player',
        (Math.random() < 0.8 && ai) ? ai.clone() : new Brains.One()
      );
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
