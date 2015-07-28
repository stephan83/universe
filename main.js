!function() {

  var NUM_PLAYERS = 20;

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
  for (var i = 0; i < NUM_PLAYERS / 2; i++) {
    universe.addPlayer(
      Math.floor(Math.random() * 40) - 20,
      Math.floor(Math.random() * 40) - 20,
      'player',
      new Brains.Less()
    );
  }
  for (i = 0; i < NUM_PLAYERS / 2; i++) {
    universe.addPlayer(
      Math.floor(Math.random() * 40) - 20,
      Math.floor(Math.random() * 40) - 20,
      'player',
      new Brains.One()
    );
  }

  // Add random resources
  for (var i = 0; i < 100; i++) {
    universe.addResource(
      Math.floor(Math.random() * 40) - 20,
      Math.floor(Math.random() * 40) - 20,
      50 + Math.floor(Math.random() * 50)
    );
  }

  var stats = document.getElementById('stats');

  universe.onLogic = function() {
    if (universe.getCycle() % 10) {
      return;
    }

    var numPlayers = universe.getTotalPlayers();
    var scores = universe.getScores();
  
    var oneScore = 0;
    var lessScore = 0;
    var oneScoreArray = [];
    var lessScoreArray = [];

    for (var id in scores) {
      if (scores.hasOwnProperty(id)) {
        var ai = universe.getAi(id);
        if (ai instanceof Brains.One) {
          oneScoreArray.push({id: parseInt(id, 10), score: scores[id]});
        } else {
          lessScoreArray.push({id: parseInt(id, 10), score: scores[id]});
        }
      }
    }

    oneScoreArray.sort(function(a, b) {
      return b.id - a.id;
    });
    oneScoreArray = oneScoreArray.slice(0, NUM_PLAYERS * 5);
    var oneScoreAlive = oneScoreArray.slice(0, NUM_PLAYERS / 2)
    oneScoreAlive.forEach(function(s) {
      oneScore += s.score;
    });
    oneScoreAlive.sort(function(a, b) {
      return b.score - a.score;
    });
    oneScoreArray.sort(function(a, b) {
      return b.score - a.score;
    });

    lessScoreArray.sort(function(a, b) {
      return b.id - a.id;
    });
    lessScoreArray = lessScoreArray.slice(0, NUM_PLAYERS * 5);
    var lessScoreAlive = lessScoreArray.slice(0, NUM_PLAYERS / 2)
    lessScoreAlive.forEach(function(s) {
      lessScore += s.score;
    });
    lessScoreAlive.sort(function(a, b) {
      return b.score - a.score;
    });
    lessScoreArray.sort(function(a, b) {
      return b.score - a.score;
    });

    var html = '<div>C: ' + universe.getCycle() + '</div>';

    html += '<div>ONE: ' + oneScore + '</div>';

    for (var i = 0; i < oneScoreAlive.length; i++) {
      html += '<div>S: ' + oneScoreAlive[i].score + '; ID: ' + oneScoreAlive[i].id + '</div>';
    }

    html += '<div>LESS: ' + lessScore + '</div>';

    for (var i = 0; i < lessScoreAlive.length; i++) {
      html += '<div>S: ' + lessScoreAlive[i].score + '; ID: ' + lessScoreAlive[i].id + '</div>';
    }

    stats.innerHTML = html;

    var frame = universe._players.getFrame();
    var brainsOneCount = 0;
    frame.each(function(x, y, player) {
      if (player.ai instanceof Brains.One) {
        brainsOneCount++;
      }
    });

    for (i = 0; i < NUM_PLAYERS - numPlayers; i++) {
      if (oneScoreArray.length) {
        var id = oneScoreArray[Math.floor(Math.random() * oneScoreArray.length)].id;
        var ai = universe.getAi(id);
      } else {
        ai = null;
      }
      do {
        var x = Math.floor(Math.random() * 40) - 20;
        var y = Math.floor(Math.random() * 40) - 20;
      } while(universe._players.getFrame().read(x, y));
      if (brainsOneCount < NUM_PLAYERS / 2) {
        universe.addPlayer(
          x,
          y,
          'player',
          (Math.random() < 0.75 && ai) ? ai.clone() : new Brains.One()
        );
        brainsOneCount++;
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
