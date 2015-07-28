!function(exports) {

  function Resources(waveFrequency) {
    this._waveFrequency = waveFrequency;
    this._frame = new Frame();
    this._cycle = 0;
  }

  Resources.prototype.getFrame = function() {
    return this._frame;
  };

  Resources.prototype.add = function(x, y, amount) {
    this._frame.write(x, y, amount);
  };

  Resources.prototype.loop = function(resourceWaves, playersFrame) {
    this._frame.each(function(x, y, amount) {
      var player = playersFrame.read(x, y);

      if (player) {
        player.resource += amount;
        playersFrame.write(x, y, player);  
        this._frame.remove(x, y);
      }
    }.bind(this));

    if (this._cycle % this._waveFrequency === 0) {
      this._frame.each(function(x, y, wall) {
        resourceWaves.emit(x, y, this._frame);
      }.bind(this));
    }

    this._cycle++;
  };

  exports.Resources = Resources;

}(window);
