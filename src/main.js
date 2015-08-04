var Less = require('./brains/less');
var map = require('./map');
var One = require('./brains/one');
var Two = require('./brains/two');
var Three = require('./brains/three');
var Neato = require('./brains/neato');
var Universe = require('./universe');

var canvas = document.getElementById('universe');
var ctx = canvas.getContext('2d');
var universe = new Universe(ctx, map);

// Add teams
universe.addTeam("Team Less", Less, 30, 8, 10000, 1, 0);
//universe.addTeam("Team HardMax", One, 30, 8, 10000, 0.1, 0.1);
//universe.addTeam("Team Sigmoid", Two, 20, 5, 2000, 0.1, 0.1);
//universe.addTeam("Team Three", Three, 30, 8, 10000, 0, 0);
universe.addTeam("Team Horny Neato", Neato, 30, 8, 10000, 0, 0.75);

// Add random resource
for (i = 0; i < 40; i++) {
  universe.addResource(50 + Math.ceil(Math.random() * 50));
}

var lastTime;
var lastCycle;
var stats = document.getElementById('stats');

universe.onLogic = function() {
  var now = Date.now();
  var cycle = universe.getCycle();

  if (lastTime) {
    var ellapsed = now - lastTime;
    var cyclesPerSecond = 1000 * (cycle - lastCycle) / ellapsed;
  }

  lastTime = now;
  lastCycle = cycle;

  if (universe.getCycle() % 10 === 0 || universe.getCycle() === 1) {
    var html = '<div>C: ' + cycle + '; CPS: ' + (cyclesPerSecond ? cyclesPerSecond.toFixed(0) : '-') +  '</div>';
    html += "<hr>";
    html += '<div id="teams">';

    universe.getTeams().forEach(function(team, teamIndex) {
      html += '<div class="team">';
      html += '<div>' + team.name + '</div>';
      html += "<hr>";
      team.best.forEach(function(player, playerIndex) {
        html += '<div data-best="true" data-team="' + teamIndex + '" data-index="' + playerIndex + '">S: ' + player.score + '; K: ' + player.kills +'; ID: ' + player.id + '</div>';
      });
      html += "<hr>";
      team.players.forEach(function(player, playerIndex) {
        html += '<div data-team="' + teamIndex + '" data-index="' + playerIndex + '">S: ' + player.score + '; K: ' + player.kills +'; ID: ' +player.id + '</div>';
      });
      html += "</div>";
    });

    html += '</div>';

    stats.innerHTML = html;
  }
};

// Set up user interface and events

var down, lastX, lastY;

window.addEventListener('resize', function() {
  resize();
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

document.getElementById('speed').addEventListener('change', function(event) {
  event.stopPropagation();
  universe.setCycleTimeout(100 - event.target.value);
  universe.render();
});

canvas.addEventListener('mousedown', function(event) {
  event.preventDefault();
  down = true;
  lastX = event.pageX;
  lastY = event.pageY;
});

document.body.addEventListener('mouseup', function(event) {
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

function resize() {
  var rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = window.innerHeight;
}

var sigmaGraph = new sigma({
  graph: graph,
  container: 'graph',
  settings: {
    defaultNodeColor: '#FF0033',
    edgeColor: '#666666'
  }
});

document.getElementById('stats').addEventListener('click', function(event) {
  var target = event.target;
  var team = target.dataset.team;
  var index = target.dataset.index;
  var best = target.dataset.best;

  if (typeof team !== 'undefined' && typeof index !== 'undefined') {
    var team = universe.getTeams()[team];
    var player = best ? team.best[index] : team.players[index];
    sigmaGraph.graph.clear();
    if (player.brain.toGraph) {
      sigmaGraph.graph.read(player.brain.toGraph());
    }
    sigmaGraph.refresh();
  }
});

// Boot

resize();
universe.start();

window.universe = universe;
