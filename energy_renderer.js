!function(exports) {

  var EnergyRenderer = {};

  EnergyRenderer.render = function(ctx, frame, viewX, viewY, zoom) {
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
        ctx.fillStyle = 'rgb(255,255,255)';  
        ctx.fillRect(mapped.left, mapped.top, cellSize, cellSize);
        ctx.textAlign = 'center';
        ctx.lineWidth = 2;
        ctx.strokeText(data.amp, mapped.centerX, mapped.centerY - cellSize);
        ctx.fillText(data.amp, mapped.centerX, mapped.centerY - cellSize);
      }
    });
  };

  exports.EnergyRenderer = EnergyRenderer;

}(window);
