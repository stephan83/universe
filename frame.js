!function(exports) {

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

  Frame.prototype.each = function(func) {
    this._eachDepth++;
    for (var hash in this._informationMap) {
      if (this._informationMap.hasOwnProperty(hash)) {
        var coords = Frame._unhash(hash);
        func(coords[0], coords[1], this._informationMap[hash]);
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

  exports.Frame = Frame;

}(window);
