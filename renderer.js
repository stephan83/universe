!function(exports) {

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

  exports.Renderer = Renderer;

}(window);
