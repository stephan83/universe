(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Universe = require('../universe');

function shuffle(o){
  for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
}

function Less() {

};

Less.prototype.loop = function(sensors) {
  var enemiesSensors = sensors.enemies;

  var order = [0, 1, 2, 3, 4, 5, 6, 7];
  shuffle(order);

  var highestEnemySensorVal = -Infinity;
  var highestEnemySensorDir;
  var lowestEnemySensorVal = Infinity;
  var lowestEnemySensorDir;

  for (var i = 0; i < order.length; i++) {
    var j = order[i];
    var value = enemiesSensors[j];
    if (value > highestEnemySensorVal) {
      highestEnemySensorVal = value;
      highestEnemySensorDir = j;
    }
    if (value < lowestEnemySensorVal) {
      lowestEnemySensorVal = value;
      lowestEnemySensorDir = j;
    }
  }

  var resourceSensors = sensors.resources;

  var highestResourceSensorVal = -Infinity;
  var highestResourceSensorDir;
  var lowestResourceSensorVal = Infinity;
  var lowestResourceSensorDir;

  for (var i = 0; i < order.length; i++) {
    var j = order[i];
    var value = resourceSensors[j];
    if (value > highestResourceSensorVal) {
      highestResourceSensorVal = value;
      highestResourceSensorDir = j;
    }
    if (value < lowestResourceSensorVal) {
      lowestResourceSensorVal = value;
      lowestResourceSensorDir = j;
    }
  }

  var critical = sensors.resource <= 60;

  if (highestEnemySensorVal > 0 && sensors.ammo >= 5 && !critical && !sensors.allies[highestEnemySensorDir]) {
    if (highestEnemySensorVal > 10) {
      return Universe.fireCommand(highestEnemySensorDir);
    }
    return Universe.moveCommand(highestEnemySensorDir);
  } else if (highestResourceSensorVal > 0 && critical) {
    return Universe.moveCommand(highestResourceSensorDir);
  } else if (critical && highestEnemySensorVal > 0) {
    return Universe.moveCommand(lowestEnemySensorDir);
  } else if (highestResourceSensorVal > 0) {
    return Universe.moveCommand(highestResourceSensorDir);
  } else if (highestEnemySensorVal > 0 && sensors.resource > 80) {
    return Universe.moveCommand(highestEnemySensorDir);
  } else if (Math.random() < 0.2) {
    return Universe.moveCommand(Math.floor(Math.random() * 8));
  }
};

Less.prototype.mutate = function() {
  return new Less();
};

Less.prototype.mate = function() {
  return new Less();
};

module.exports = Less;

},{"../universe":14}],2:[function(require,module,exports){
var Neat = require('../neat');
var Universe = require('../universe');

function Neato(network) {
  this._network = network || new Neat(42, 21).mutate();
  this._inputs = new Float32Array([
    0, 0, 0, 0, 0, 0, 0, 0, // Resources sensors
    0, 0, 0, 0, 0, 0, 0, 0, // Allies sensors
    0, 0, 0, 0, 0, 0, 0, 0, // Enemies sensors
    0, 0, 0, 0, 0, 0, 0, 0, // Missiles sensors
    0, 0, 0, 0,             // Wall sensors
    0,                      // Resource
    0,                      // Ammo
    0, 0, 0, 0              // Feeback
  ]);
};

Neato.prototype.loop = function(sensors) {
  var inputs = this._inputs;
  var j = 0;

  // Fill sensor inputs
  for (var i = 0; i < 8; i++) {
    inputs[j++] = sensors.resources[i] / 25;
  }
  for (i = 0; i < 8; i++) {
    inputs[j++] = sensors.allies[i] / 25;
  }
  for (i = 0; i < 8; i++) {
    inputs[j++] = sensors.enemies[i] / 25;
  }
  for (i = 0; i < 8; i++) {
    inputs[j++] = sensors.missiles[i] / 25;
  }
  for (i = 0; i < 4; i++) {
    inputs[j++] = sensors.walls[i] / 25;
  }

  inputs[j++] = sensors.resource / 100;
  inputs[j++] = sensors.ammo / 10;

  // Feed inputs to neural network

  var outputs = this._network.process(inputs);

  // Save output feedback for next loop

  for (i = outputs.length - 4; i < outputs.length; i++) {
    inputs[j++] = outputs[i];
  }

  // Find highest non feedback output

  var maxValue = 0;
  var maxIndex;

  for (var i = 0; i < 17; i++) {
    var value = outputs[i];

    if (value > maxValue) {
      maxValue = value;
      maxIndex = i;
    }
  }

  // Output 0-7 => Move

  if (maxIndex < 8) {
    return Universe.moveCommand(maxIndex);
  }

  // Output 8 -16 => Move

  if (maxIndex < 16) {
    return Universe.fireCommand(maxIndex - 8);
  }

  // If max index is 17, do nothing
};

Neato.prototype.mutate = function() {
  return new Neato(this._network.mutate());
};

Neato.prototype.mate = function(partner) {
  // TODO crossover
  return new Neato(this._network.mutate());
};

Neato.prototype.toGraph = function() {
  return this._network.toGraph();
};

module.exports = Neato;

},{"../neat":10,"../universe":14}],3:[function(require,module,exports){
// Simple feed forward brain

var FeedForward = require('../feed_forward');
var Universe = require('../universe');

function One(network) {
  this._network = network || new FeedForward.HardMax([22, 22, 20, 17]);
  this._inputs = new Float32Array([
    0, 0, 0, 0, 0, 0, 0, 0, // Resources sensors
    //0, 0, 0, 0, 0, 0, 0, 0, // Allies sensors
    0, 0, 0, 0, 0, 0, 0, 0, // Enemies sensors
    //0, 0, 0, 0, 0, 0, 0, 0, // Missiles sensors
    0, 0, 0, 0,             // Wall sensors
    0,                      // Resource
    0,                      // Ammo
    //0, 0, 0, 0              // Feeback
  ]);
};

One.prototype.loop = function(sensors) {
  var inputs = this._inputs;
  var j = 0;

  // Fill sensor inputs
  for (var i = 0; i < 8; i++) {
    inputs[j++] = sensors.resources[i] / 25;
  }
  /*for (i = 0; i < 8; i++) {
    inputs[j++] = sensors.allies[i] / 25;
  }*/
  for (i = 0; i < 8; i++) {
    inputs[j++] = sensors.enemies[i] / 25;
  }
  /*for (i = 0; i < 8; i++) {
    inputs[j++] = sensors.missiles[i] / 25;
  }*/
  for (i = 0; i < 4; i++) {
    inputs[j++] = sensors.walls[i] / 25;
  }

  inputs[j++] = sensors.resource / 100;
  inputs[j++] = sensors.ammo / 10;

  // Feed inputs to neural network

  var outputs = this._network.process(inputs);

  // Save output feedback for next loop

  /*for (i = outputs.length - 4; i < outputs.length; i++) {
    inputs[j++] = outputs[i];
  }*/

  // Find highest non feedback output

  var maxValue = 0;
  var maxIndex;

  for (var i = 0; i < 17; i++) {
    var value = outputs[i];

    if (value > maxValue) {
      maxValue = value;
      maxIndex = i;
    }
  }

  // Output 0-7 => Move

  if (maxIndex < 8) {
    return Universe.moveCommand(maxIndex);
  }

  // Output 8 -16 => Move

  if (maxIndex < 16) {
    return Universe.fireCommand(maxIndex - 8);
  }

  // If max index is 17, do nothing
};

One.prototype.mutate = function() {
  return new One(this._network.mutate());
};

One.prototype.mate = function(partner) {
  return new One(this._network.mate(partner._network));
};

module.exports = One;

},{"../feed_forward":5,"../universe":14}],4:[function(require,module,exports){
// Simple feed forward brain

var FeedForward = require('../feed_forward');
var Universe = require('../universe');

function Two(network) {
  this._network = network || new FeedForward.Sigmoid([42, 42, 32, 21]);
  this._inputs = new Float32Array([
    0, 0, 0, 0, 0, 0, 0, 0, // Resources sensors
    0, 0, 0, 0, 0, 0, 0, 0, // Allies sensors
    0, 0, 0, 0, 0, 0, 0, 0, // Enemies sensors
    0, 0, 0, 0, 0, 0, 0, 0, // Missiles sensors
    0, 0, 0, 0,             // Wall sensors
    0,                      // Resource
    0,                      // Ammo
    0, 0, 0, 0              // Feeback
  ]);
};

Two.prototype.loop = function(sensors) {
  var inputs = this._inputs;
  var j = 0;

  // Fill sensor inputs
  for (var i = 0; i < 8; i++) {
    inputs[j++] = sensors.resources[i] / 25;
  }
  for (i = 0; i < 8; i++) {
    inputs[j++] = sensors.allies[i] / 25;
  }
  for (i = 0; i < 8; i++) {
    inputs[j++] = sensors.enemies[i] / 25;
  }
  for (i = 0; i < 8; i++) {
    inputs[j++] = sensors.missiles[i] / 25;
  }
  for (i = 0; i < 4; i++) {
    inputs[j++] = sensors.walls[i] / 25;
  }

  inputs[j++] = sensors.resource / 100;
  inputs[j++] = sensors.ammo / 10;

  // Feed inputs to neural network

  var outputs = this._network.process(inputs);

  // Save output feedback for next loop

  for (i = outputs.length - 4; i < outputs.length; i++) {
    inputs[j++] = outputs[i];
  }

  // Find highest non feedback output

  var maxValue = 0;
  var maxIndex;

  for (var i = 0; i < 17; i++) {
    var value = outputs[i];

    if (value > maxValue) {
      maxValue = value;
      maxIndex = i;
    }
  }

  // Output 0-7 => Move

  if (maxIndex < 8) {
    return Universe.moveCommand(maxIndex);
  }

  // Output 8 -16 => Move

  if (maxIndex < 16) {
    return Universe.fireCommand(maxIndex - 8);
  }

  // If max index is 17, do nothing
};

Two.prototype.mutate = function() {
  return new Two(this._network.mutate());
};

Two.prototype.mate = function(partner) {
  return new Two(this._network.mate(partner._network));
};

module.exports = Two;

},{"../feed_forward":5,"../universe":14}],5:[function(require,module,exports){
// A feed forward network.
// NOTE: If you need to save the outputs, create a copy of the result because
// the returned subarray's buffer is reused. This is to avoid allocating
// memory unnecessary.

function randomWeight() {
  return Math.random() < 0.5 ? Math.random() : -Math.random();
}

function FeedForward(sizes, data) {
  this._sizes = new Float32Array(sizes);

  var dataLength = 0;
  var ioLength = 0;
  for (var i = 0; i < sizes.length; i++) {
    ioLength += sizes[i];
    if (i > 0) {
      dataLength += (sizes[i - 1] + 1) * sizes[i];
    }
  }

  if (data) {
    this._data = new Float32Array(data);
  } else {
    this._data = new Float32Array(dataLength);
    for (var i = 0; i < dataLength; i++) {
      this._data[i] = randomWeight();
    }
  }

  this._io = new Float32Array(ioLength);
  this._outputs = this._io.subarray(ioLength - sizes[sizes.length - 1]);
}

FeedForward.prototype.marshal = function() {
  return {
    sizes: Array.prototype.slice.call(this._sizes) ,
    data: Array.prototype.slice.call(this._data) 
  };
};

FeedForward.prototype.mutate = function() {
  var data = new Float32Array(this._data.length);
  for (var i = 0; i < this._data.length; i++) {
    data[i] = this._data[i] + (Math.random() < 0.1 ? randomWeight() : 0);
  }
  return new this.constructor(this._sizes, data);
};

FeedForward.prototype.mate = function(partner) {
  var data = new Float32Array(this._data.length);
  for (var i = 0; i < this._data.length; i++) {
    data[i] = Math.random() < 0.5 ? this._data[i] : partner._data[i];
  }
  return new this.constructor(this._sizes, data);
};

FeedForward.unmarshal = function(js) {
  return new this.constructor(js.sizes, js.data);
};

FeedForward.HardMax = function(sizes, data) {
  FeedForward.call(this, sizes, data);
};

FeedForward.HardMax.prototype.process = function(inputs) {
  this._io.set(inputs);
  var dataIndex = 0, readIndex = 0, writeIndex = this._sizes[0];
  var numInputs, numNeurons, sum, i, j, k;
  for (i = 1; i < this._sizes.length; i++) {
    numInputs = this._sizes[i - 1];
    numNeurons = this._sizes[i];
    for (j = 0; j < numNeurons; j++) {
      sum = this._data[dataIndex++];
      for (k = 0; k < numInputs; k++) {
        sum += this._data[dataIndex++] * this._io[readIndex + k];
      }
      this._io[writeIndex + j] = Math.max(0, sum);
    }
    readIndex += numInputs;
    writeIndex += numNeurons;
  }
  return this._outputs;
};

FeedForward.Sigmoid = function(sizes, data) {
  FeedForward.call(this, sizes, data);
};

FeedForward.Sigmoid.prototype.process = function(inputs) {
  this._io.set(inputs);
  var dataIndex = 0, readIndex = 0, writeIndex = this._sizes[0];
  var numInputs, numNeurons, sum, i, j, k;
  for (i = 1; i < this._sizes.length; i++) {
    numInputs = this._sizes[i - 1];
    numNeurons = this._sizes[i];
    for (j = 0; j < numNeurons; j++) {
      sum = this._data[dataIndex++];
      for (k = 0; k < numInputs; k++) {
        sum += this._data[dataIndex++] * this._io[readIndex + k];
      }
      this._io[writeIndex + j] = 1 / (1 - Math.exp(-sum));
    }
    readIndex += numInputs;
    writeIndex += numNeurons;
  }
  return this._outputs;
};

for (var s in FeedForward.prototype) {
  if (FeedForward.prototype.hasOwnProperty(s)) {
    FeedForward.HardMax.prototype[s] = FeedForward.prototype[s];
    FeedForward.Sigmoid.prototype[s] = FeedForward.prototype[s];
  }
}

module.exports = FeedForward;

},{}],6:[function(require,module,exports){
function Frame() {
  this._informationMap = {};
  this._removed = {};
  this._eachDepth = 0;
  this._total = 0;
}

Frame.prototype.read = function(x, y, data) {
  var hash = Frame._hash(x, y);
  if (this._removed[hash]) {
    return;
  }
  return this._informationMap[hash];
};

Frame.prototype.write = function(x, y, data) {
  var hash = Frame._hash(x, y);
  if (typeof this._informationMap[hash] === 'undefined') {
    this._total++;
  }
  delete this._removed[hash];
  this._informationMap[hash] = data;
};

Frame.prototype.remove = function(x, y) {
  var hash = Frame._hash(x, y);
  if (typeof this._informationMap[hash] !== 'undefined') {
    delete this._informationMap[hash];
    this._removed[hash] = true;
    this._total--;
  }
};

Frame.prototype.each = function(func, ctx) {
  this._eachDepth++;
  for (var hash in this._informationMap) {
    if (this._informationMap.hasOwnProperty(hash)) {
      var coords = Frame._unhash(hash);
      func.call(ctx, coords[0], coords[1], this._informationMap[hash]);
    }
  }
  this._eachDepth--;
  if (this._eachDepth < 1) {
    this._removed = {};
  }
};

Frame.prototype.getTotal = function() {
  return this._total;
};

Frame._hash = function(x, y) {
  return x.toString() + ':' + y.toString();
};

Frame._unhash = function(hash) {
  return hash.split(':').map(function(s) {
    return parseInt(s, 10);
  });
};

module.exports = Frame;

},{}],7:[function(require,module,exports){
var Less = require('./brains/less');
var map = require('./map');
var One = require('./brains/one');
var Two = require('./brains/two');
var Neato = require('./brains/neato');
var Universe = require('./universe');

var canvas = document.getElementById('universe');
var ctx = canvas.getContext('2d');
var universe = new Universe(ctx, map);

// Add teams
universe.addTeam("Team Less", Less, 20, 8, 5000, 1, 0);
universe.addTeam("Team HardMax", One, 20, 8, 5000, 0.1, 0.1);
//universe.addTeam("Team Sigmoid", Two, 20, 5, 2000, 0.1, 0.1);
universe.addTeam("Team Neato", Neato, 20, 8, 5000, 0, 0.1);

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

},{"./brains/less":1,"./brains/neato":2,"./brains/one":3,"./brains/two":4,"./map":8,"./universe":14}],8:[function(require,module,exports){

module.exports = [
  'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x....................................................................................x..........................x',
  'x....................................................................................x..........................x',
  'x...............................xxxxxxxxxxxxxxxxxx...................................x..........................x',
  'x...............................x                x...................................x..........................x',
  'x...............................x                x...................................x..........................x',
  'x...............................x                x...................................x..........................x',
  'x...............................x                x...................................x..........................x',
  'x...............................x                x...................................x..........................x',
  'x...............................x                x...................................x..........................x',
  'x...............................xxxxxxxxxxxxxxxxxx...................................x..........................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'xxxxxx..........................................................................................................x',
  '     x..........................................................................................................x',
  '     x..........................................................................................................x',
  '     x..........................................................................................................x',
  '     x........................................xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.......................x',
  '     x........................................x                                         x.......................x',
  '     x........................................x                                         x.......................x',
  '     x........................................x                                         x.......................x',
  '     x........................................x                                         x.......................x',
  '     x........................................x                        xxxxxxxxxxxxxxxxxx.......................x',
  '     x........................................x                        x........................................x',
  '     x........................................x                        x........................................x',
  '     x........................................x                        x........................................x',
  '     x........................................x                        xxxxxxxxxxxxxxxxxx.......................x',
  '     x........................................x                                         x.......................x',
  '     x........................................x                                         x.......................x',
  '     x........................................x                                         x.......................x',
  '     x........................................x                                         x.......................x',
  '     x........................................xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.......................x',
  '     x..........................................................................................................x',
  '     x..........................................................................................................x',
  '     x..........................................................................................................x',
  'xxxxxx..........................................................................................................x',
  'x......................................................................xxxxxxx..................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................xxxxxxxxxxxxxxxxxx..............................................................x',
  'x...............................x                x..............................................................x',
  'x...............................x                x..............................................................x',
  'x...............................x                x..............................................................x',
  'x...............................x                x..............................................................x',
  'x...............................x                x..............................................................x',
  'x...............................x                x..............................................................x',
  'x...............................x                x..........................xxxxxxxxxxxx........................x',
  'x...............................x                x..........................x...................................x',
  'x...............................x                x..........................x...................................x',
  'x...............................x                x..........................x...................................x',
  'x...............................xxxxxxxxxxxxxxxxxx..........................x...................................x',
  'x...........................................................................x...................................x',
  'x...........................................................................x...................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'x...............................................................................................................x',
  'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
];

},{}],9:[function(require,module,exports){
var Frame = require('./frame');

function Missiles(directions, cost, initialEnergy) {
  this._directions = directions;
  this._cost = cost;
  this._initialEnergy = initialEnergy;
  this._frame = new Frame();
}

Missiles.prototype.getFrame = function() {
  return this._frame;
};

Missiles.prototype.getCost = function() {
  return this._cost;
};

Missiles.prototype.setWallsFrame = function(value) {
  this._wallsFrame = value;
};

Missiles.prototype.setPlayers = function(value) {
  this._players = value;
};

Missiles.prototype.fire = function(player, x, y, dir) {
  var direction = this._directions[dir];
  var startX = x + direction[0];
  var startY = y + direction[1];

  if (this._wallsFrame.read(startX, startY)) {
    return;
  }

  var missiles = this._frame.read(startX, startY) || [];

  missiles.push({
    direction: dir,
    energy: this._initialEnergy,
    emitter: player
  });

  this._frame.write(startX, startY, missiles);
};

Missiles.prototype.loop = function() {
  var previous = this._frame;
  this._frame = new Frame();

  previous.each(function(x, y, missiles) {
    missiles.forEach(function(missile) {
      missile.energy--;

      if (missile.energy > 0) {
        var direction = this._directions[missile.direction];
        var destX = x + direction[0];
        var destY = y + direction[1];

        if (this._wallsFrame.read(destX, destY)) {
          return;
        }

        var player = this._players.getFrame().read(destX, destY);

        if (player) {
          player.resource -= missile.energy;

          if (missile.emitter.team === player.team) {
            missile.emitter.score = Math.max(0, missile.emitter.score - missile.energy);
          } else {
            missile.emitter.score += missile.energy;
            if (player.resource < 1) {
              missile.emitter.kills++;
            }
          }

          if (player.resource < 1) {
            this._players.getFrame().remove(destX, destY);
          } else {
            var sensor = player.sensors.missiles;
            sensor[(missiles.direction + 4) % 8] += missile.energy;
            this._players.getFrame().write(destX, destY, player);
          }   
        } else {
          var dest = this._frame.read(destX, destY) || [];
          dest.push(missile);
          this._frame.write(destX, destY, dest);
        }
      }
    }.bind(this));
  }.bind(this));
};

module.exports = Missiles;

},{"./frame":6}],10:[function(require,module,exports){
// Neat with feed forward nodes only

var NODE_INPUT = 0;
var NODE_OUTPUT = 1;
var NODE_HIDDEN = 2;

function randomWeight() {
  return Math.random() < 0.5 ? Math.random() : -Math.random();
}

var nodeCount = 0;
var innovationCount = 0;

function Neat(numInputs, numOutputs, nodeGenes, connGenes) {
  this._numInputs = numInputs;
  this._numOutputs = numOutputs;
  this._nodeGenes = nodeGenes;
  this._connGenes = connGenes;
  this._nodeToLayerMap = {};
  this._nodeInputs = [];
  this._nodeOutputs = [];

  if (!this._nodeGenes) {
    this._nodeGenes = [];
    this._connGenes = [];

    var inputNodes = [];

    for (var i = 0; i < numInputs; i++) {
      inputNodes.push([nodeCount++, NODE_INPUT]);
    }

    this._nodeGenes.push(inputNodes);

    var outputNodes = [];

    for (i = 0; i < numOutputs; i++) {
      outputNodes.push([nodeCount++, NODE_OUTPUT]);
    }

    this._nodeGenes.push(outputNodes);
  }

  this._numNodeGenes = 0;

  for (i = 0; i < this._nodeGenes.length; i++) {
    var layer = this._nodeGenes[i];
    this._numNodeGenes += layer.length;
    for (j = 0; j < layer.length; j++) {
      var node = layer[j];
      this._nodeToLayerMap[node[0]] = layer;
    }
  }

  for (i = 0; i < this._connGenes.length; i++) {
    var conn = this._connGenes[i];
    this._nodeInputs[conn.output] = this._nodeInputs[conn.output] || [];
    this._nodeInputs[conn.output].push(conn);
    this._nodeOutputs[conn.input] = this._nodeOutputs[conn.input] || [];
    this._nodeOutputs[conn.input].push(conn);
  }
}

Neat.prototype.process = function(inputs) {
  var nodeValues = [];

  for (var i = 0; i < this._nodeGenes[0].length; i++) {
    var node = this._nodeGenes[0][i];
    nodeValues[node[0]] = inputs[i];
  }

  for (i = 1; i < this._nodeGenes.length; i++) {
    var layer = this._nodeGenes[i];
    for (var j = 0; j < layer.length; j++) {
      node = layer[j];
      var nodeInputs = this._nodeInputs[node[0]];

      if (!nodeInputs) {
        continue;
      }

      var sum = 0;

      for (var k = 0; k < nodeInputs.length; k++) {
        var inputConn = nodeInputs[k];
        if (inputConn.enabled) {
          sum += (nodeValues[inputConn.input] || 0) * inputConn.weight;
        }
      }

      nodeValues[node[0]] = 1 / (1 + Math.exp(-sum));
    }
  }

  var outputs = [];

  for (i = 0; i < this._nodeGenes[this._nodeGenes.length - 1].length; i++) {
    node = layer[i];
    outputs[i] = nodeValues[node[0]] || 0;
  }

  return outputs;
};

Neat.prototype.findConnection = function(input, output) {
  var conns = this._nodeOutputs[input];

  if (!conns) {
    return false;
  }

  for (var i = 0; i < conns.length; i++) {
    var conn = conns[i];
    if (conn.output === output) {
      return conn;
    }
  }
};

Neat.prototype.addConnection = function(input, output, weight) {
  var existing = this.findConnection(input, output);
  if (existing) {
    if (existing.enabled) {
      return false;
    }
    existing.enabled = true;
    return true;
  }

  var inputLayer = this._nodeToLayerMap[input];
  var outputLayer = this._nodeToLayerMap[output];
  var inputLayerIndex = this._nodeGenes.indexOf(inputLayer);
  var outputLayerIndex = this._nodeGenes.indexOf(outputLayer);

  if (inputLayerIndex >= outputLayerIndex) {
    return false;
  }

  var conn = {
    input: input,
    output: output,
    weight: weight,
    enabled: true,
    innovation: innovationCount++
  };

  this._connGenes.push(conn);

  this._nodeInputs[conn.output] = this._nodeInputs[conn.output] || [];
  this._nodeInputs[conn.output].push(conn);
  this._nodeOutputs[conn.input] = this._nodeOutputs[conn.input] || [];
  this._nodeOutputs[conn.input].push(conn);

  return true;
};

Neat.prototype.addNode = function(input, output, weight1, weight2) {
  var conn = this.findConnection(input, output);

  if (!conn) {
    return false;
  }

  var inputLayer = this._nodeToLayerMap[input];
  var outputLayer = this._nodeToLayerMap[output];
  var inputLayerIndex = this._nodeGenes.indexOf(inputLayer);
  var outputLayerIndex = this._nodeGenes.indexOf(outputLayer);

  if (inputLayerIndex >= outputLayerIndex) {
    return false;
  }

  var nodeId = nodeCount++;

  if (inputLayerIndex + 1 === outputLayerIndex) {
    var layerIndex = outputLayerIndex;
    this._nodeGenes.splice(layerIndex, 0, [[nodeId, NODE_HIDDEN]]);
  } else {
    layerIndex = Math.floor((inputLayerIndex + outputLayerIndex) * 0.5);
    this._nodeGenes[layerIndex].push([nodeId, NODE_HIDDEN]);
  }

  this._nodeToLayerMap[nodeId] = this._nodeGenes[layerIndex];
  conn.enabled = false;
  this.addConnection(input, nodeId, weight1);
  this.addConnection(nodeId, output, weight2);
  this._numNodeGenes++;

  return true;
};

Neat.prototype.clone = function() {
  var nodes = this._nodeGenes.map(function(layer) {
    return layer.map(function(gene) {
      return gene.slice();
    });
  });
  var connections = this._connGenes.map(function(gene) {
    return {
      input: gene.input,
      output: gene.output,
      weight: gene.weight,
      enabled: gene.enabled,
      innovation: gene.innovation
    };
  });
  return new Neat(this._numInputs, this._numOutputs, nodes, connections);
}

Neat.prototype._randomInputOutput = function() {
  var len = this._nodeGenes.length - 1;
  var numOutputs = this._nodeGenes[len].length;
  var numPrev = 0;
  var inputPos = Math.floor(Math.random() * (this._numNodeGenes - numOutputs));
  for (var i = 0; numPrev <= inputPos; i++) {
    var layer = this._nodeGenes[i];
    numPrev += layer.length;
  }
  var input = layer[Math.floor(Math.random() * layer.length)][0];

  var outputPos = numPrev + Math.floor(Math.random() * (this._numNodeGenes - numPrev));

  for (; numPrev <= outputPos; i++) {
    layer = this._nodeGenes[i];
    numPrev += layer.length;
  }
  var output = layer[Math.floor(Math.random() * layer.length)][0];

  return [input, output];
}

Neat.prototype.mutate = function() {
  var clone = this.clone();

  for (var i = 0; i < clone._connGenes.length; i++) {
    if (clone._connGenes[i].enabled && Math.random() < 0.1) {
      clone._connGenes[i].weight += randomWeight();
    }
  }

  if (Math.random() < 0.9) {
    // Add connection
    i = 0;
    do {
      var inputOutput = this._randomInputOutput();
      var from = inputOutput[0];
      var to = inputOutput[1];
      var conn = this.findConnection(from, to);
    } while(conn && i++ < 100);

    if (!conn) {
      clone.addConnection(from, to, randomWeight());
    }
  } else {
    // Add node
    i = 0;
    do {
      var inputOutput = this._randomInputOutput();
      var from = inputOutput[0];
      var to = inputOutput[1];
      var conn = this.findConnection(from, to);
    } while((!conn || conn.disabled) && i++ < 100);

    if (conn) {
      clone.addNode(from, to, 1, conn.weight);
    }
  }

  return clone;
};

Neat.prototype.marshal = function() {
  var nodes = this._nodeGenes.map(function(layer) {
    return layer.map(function(gene) {
      return gene.slice();
    });
  });
  var connections = this._connGenes.map(function(gene) {
    return {
      input: gene.input,
      output: gene.output,
      weight: gene.weight,
      enabled: gene.enabled,
      innovation: gene.innovation
    };
  });
  return {
    nodes: nodes,
    connections: connections
  };
}

Neat.prototype.toGraph = function() {
  var nodes = [];
  var edges = [];

  this._nodeGenes.forEach(function(layer, x) {
    layer.forEach(function(node, y) {
      nodes.push({
        id: 'n' + node[0],
        x: x * 10,
        y: y,
        size: 1
      });
    });
  });

  this._connGenes.forEach(function(conn) {
    if (conn.enabled) {
      edges.push({
        id: 'e' + conn.innovation,
        source: 'n' + conn.input,
        target: 'n' + conn.output,
        label: conn.weight.toFixed(2)
      });
    }
  });

  return {nodes: nodes, edges: edges}; 
};

Neat.unmarshal = function(obj) {
  var nodes = obj.nodes.map(function(layer) {
    return layer.map(function(gene) {
      return gene.slice();
    });
  });
  var connections = obj.connections.map(function(gene) {
    return {
      input: gene.input,
      output: gene.output,
      weight: gene.weight,
      enabled: gene.enabled,
      innovation: gene.innovation
    };
  });
  return new Neat(
    nodes[0].length,
    nodes[nodes.length - 1],
    nodes,
    connections
  );
}

module.exports = Neat;

},{}],11:[function(require,module,exports){
var Frame = require('./frame');

var DIRECTIONS = [
  [-1, 0], [0, 1], [1, -1], [1, 1],
  [1, 0], [0, -1], [-1, 1], [-1, -1]
];

function Players() {
  this._frame = new Frame();
  this._idCount = 0;
}

Players.moveCommand = function(dir) {
  return {action: 'move', direction: dir};
};

Players.fireCommand = function(dir) {
  return {action: 'fire', direction: dir};
};

Players.prototype.getFrame = function() {
  return this._frame;
};

Players.prototype.setWallsFrame = function(value) {
  this._wallsFrame = value;
};

Players.prototype.setMissiles = function(value) {
  this._missiles = value;
};

Players.prototype.add = function(x, y, team, brain) {
  var id = this._idCount++;

  var player = {
    id: id,
    team: team,
    brain: brain,
    resource: 100,
    ammo: 10,
    sensors: {
      resources: [0, 0, 0, 0, 0, 0, 0, 0],
      allies: [0, 0, 0, 0, 0, 0, 0, 0],
      enemies: [0, 0, 0, 0, 0, 0, 0, 0],
      missiles: [0, 0, 0, 0, 0, 0, 0, 0],
      walls: [0, 0, 0, 0]
    },
    score: 0,
    kills: 0,
    age: 0,
    bestTime: 0
  };

  this._frame.write(x, y, player);

  return player;
};

Players.prototype.move = function(x, y, dir) {
  var player = this._frame.read(x, y);
  var direction = DIRECTIONS[dir];
  var newX = x + direction[0];
  var newY = y + direction[1];

  if (this._wallsFrame.read(newX, newY)) {
    return;
  }

  var existing = this._frame.read(newX, newY);

  if (!existing) {
    this._frame.remove(x, y);
    this._frame.write(newX, newY, player);
  }
};

Players.prototype.fire = function(x, y, dir) {
  var player = this._frame.read(x, y);

  if (player.ammo < this._missiles.getCost()) {
    return;
  }

  player.ammo -= this._missiles.getCost();
  this._frame.write(x, y, player);
  this._missiles.fire(player, x, y, dir, this._wallsFrame, this._frame);
};

Players.prototype.loop = function() {
  this._frame.each(this._loop1, this);
  this._frame.each(this._loop2, this);
};

Players.prototype._loop1 = function(x, y, player) {
  for (var j = 0; j < DIRECTIONS.length; j++) {
    var direction = DIRECTIONS[j];
    for (var i = 1; i < 26; i++) {
      var wall = this._wallsFrame.read(
        x + i * direction[0],
        y + i * direction[1]
      );
      if (wall) {
        break;
      }
      foo = this._frame.read(
        x + i * direction[0],
        y + i * direction[1]
      );
      if (foo) {
        if (foo.team === player.team) {
          player.sensors.allies[j] += 26 - i;
        } else {
          player.sensors.enemies[j] += 26 - i;
        }
      }
    }
  }
};

Players.prototype._loop2 = function(x, y, player) {
  player.resource--;
  player.score++;
  player.age++;

  if (player.resource < 1 ||
      player.age >= (1000 + Math.ceil(Math.random() * 10))) {
    this._frame.remove(x, y);
    return;
  }

  var sensors = player.sensors;
  player.ammo = Math.min(10, player.ammo + 1);
  player.sensors = {
    resources: [0, 0, 0, 0, 0, 0, 0, 0],
    allies: [0, 0, 0, 0, 0, 0, 0, 0],
    enemies: [0, 0, 0, 0, 0, 0, 0, 0],
    missiles: [0, 0, 0, 0, 0, 0, 0, 0],
    walls: [0, 0, 0, 0]
  };
  this._frame.write(x, y, player);

  sensors.resource = player.resource;
  sensors.ammo = player.ammo;
  
  var command = player.brain.loop(sensors);

  if (command) {
    switch (command.action) {
    case 'move':
      this.move(x, y, command.direction);
      break;
    case 'fire':
      this.fire(x, y, command.direction);
      break;
    }
  }
};

module.exports = Players;

},{"./frame":6}],12:[function(require,module,exports){
var Renderer = {};

Renderer.render = function(ctx, frame, viewX, viewY, zoom, colorizer) {
  var width = ctx.canvas.clientWidth;
  var height = ctx.canvas.clientHeight;
  var cellSize = Math.pow(2, zoom + 1) * 0.5;

  frame.each(function(x, y, data) {
    var mapped = Renderer.map(x, y, width, height, viewX, viewY, cellSize);
    var visible = mapped.left <= width &&
                  mapped.right >= 0 &&
                  mapped.top <= height &&
                  mapped.bottom >= 0;
    if (visible) {
      ctx.fillStyle = colorizer(data);  
      ctx.fillRect(mapped.left, mapped.top, cellSize, cellSize);
    }
  });
};

Renderer.map = function(x, y, width, height, viewX, viewY, cellSize) {
  var scaledX = x * cellSize;
  var scaledY = y * cellSize;
  var translatedX = scaledX - viewX;
  var translatedY = scaledY - viewY;
  var centerX = translatedX + width * 0.5;
  var centerY = translatedY + height * 0.5;
  return {
    left: centerX - cellSize * 0.5,
    top: centerY - cellSize * 0.5,
    right: centerX + cellSize * 0.5,
    bottom: centerY + cellSize * 0.5,
    centerX: centerX,
    centerY: centerY
  };
};

module.exports = Renderer;

},{}],13:[function(require,module,exports){
var Frame = require('./frame');

var DIRECTIONS = [
  [-1, 0], [0, 1], [1, -1], [1, 1],
  [1, 0], [0, -1], [-1, 1], [-1, -1]
];

function Resources() {
  this._frame = new Frame();
}

Resources.prototype.getFrame = function() {
  return this._frame;
};

Resources.prototype.setPlayersFrame = function(value) {
  this._playersFrame = value;
};

Resources.prototype.setWallsFrame = function(value) {
  this._wallsFrame = value;
};

Resources.prototype.setAddResource = function(value) {
  this._addResource = value;
};

Resources.prototype.add = function(x, y, amount) {
  this._frame.write(x, y, amount);
};

Resources.prototype.loop = function() {
  this._playersFrame.each(this._playerLoop, this);
};

Resources.prototype._playerLoop = function(x, y, player) {
  var resource = this._frame.read(x, y);

  if (resource) {
    player.resource = Math.min(100, player.resource + resource);
    this._frame.remove(x, y);
    this._addResource(resource);
    return;
  }

  for (var j = 0; j < DIRECTIONS.length; j++) {
    var direction = DIRECTIONS[j];
    for (var i = 1; i <= 25; i++) {
      var wall = this._wallsFrame.read(
        x + i * direction[0],
        y + i * direction[1]
      );
      if (wall) {
        break;
      }
      resource = this._frame.read(
        x + i * direction[0],
        y + i * direction[1]
      );
      if (resource) {
        player.sensors.resources[j] += 26 - i;
        break;
      }
    }
  }
};

module.exports = Resources;

},{"./frame":6}],14:[function(require,module,exports){
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
    if (team.best.length > team.bestSize) {
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

},{"./missiles":9,"./players":11,"./renderer":12,"./resources":13,"./walls":15}],15:[function(require,module,exports){
var Frame = require('./frame');

var DIRECTIONS = [
  [-1, 0], [0, 1],
  [1, 0], [0, -1]
];

function Walls() {
  this._frame = new Frame();
}

Walls.prototype.getFrame = function() {
  return this._frame;
};

Walls.prototype.setPlayersFrame = function(value) {
  this._playersFrame = value;
};

Walls.prototype.add = function(x, y) {
  this._frame.write(x, y, true);
};

Walls.prototype.loop = function() {
  this._playersFrame.each(this._playerLoop, this);
};

Walls.prototype._playerLoop = function(x, y, player) {
  for (var j = 0; j < DIRECTIONS.length; j++) {
    var direction = DIRECTIONS[j];
    for (var i = 1; i <= 25; i++) {
      var wall = this._frame.read(
        x + i * direction[0],
        y + i * direction[1]
      );
      if (wall) {
        player.sensors.walls[j] += 26 - i;
        break;
      }
    }
  }
};

module.exports = Walls;

},{"./frame":6}]},{},[7])


//# sourceMappingURL=bundle.js.map