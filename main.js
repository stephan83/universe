!function() {

  var canvas = document.getElementById('universe');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  var ctx = canvas.getContext('2d');
  var universe = new Universe(ctx);

  // Create walls
  for (i = -25; i <= 25; i++) {
    universe.addWall(i, 25);
    universe.addWall(i, -25);
    universe.addWall(25, i);
    universe.addWall(-25, i);
  }
  for (i = -10; i <= 10; i++) {
    universe.addWall(i, 0);
  }

  // Add random players
  for (var i = 0; i < 20; i++) {
    universe.addPlayer(
      Math.floor(Math.random() * 40) - 20,
      Math.floor(Math.random() * 40) - 20,
      'player-' + (i + 1),
      Brains.Less
    );
  }

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

}();
