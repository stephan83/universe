!function(exports) {

  function Walls(waveFrequency) {
    this._waveFrequency = waveFrequency;
    this._frame = new Frame();
    this._cycle = 0;
  }

  Walls.prototype.getFrame = function() {
    return this._frame;
  };

  Walls.prototype.add = function(x, y) {
    this._frame.write(x, y, true);
  };

  Walls.prototype.loop = function(wallWaves) {
    if (this._cycle % this._waveFrequency === 0) {
      this._frame.each(function(x, y, wall) {
        wallWaves.emit(x, y, this._frame);
      }.bind(this));
    }

    this._cycle++;
  };

  exports.Walls = Walls;

}(window);
