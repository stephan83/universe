!function(exports) {

  function shuffle(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
  }

  function Less() {

  };

  Less.prototype.loop = function(sensors) {
    var playerSensors = sensors.players || [];

    var order = [0, 1, 2, 3, 4, 5, 6, 7];
    shuffle(order);

    var highestPlayerSensorVal = -Infinity;
    var highestPlayerSensorDir;
    var lowestPlayerSensorVal = Infinity;
    var lowestPlayerSensorDir;

    for (var i = 0; i < order.length; i++) {
      var j = order[i];
      var value = playerSensors[j] || 0;
      if (value > highestPlayerSensorVal) {
        highestPlayerSensorVal = value;
        highestPlayerSensorDir = j;
      }
      if (value < lowestPlayerSensorVal) {
        lowestPlayerSensorVal = value;
        lowestPlayerSensorDir = j;
      }
    }

    var resourceSensors = sensors.resources || [];

    var highestResourceSensorVal = -Infinity;
    var highestResourceSensorDir;
    var lowestResourceSensorVal = Infinity;
    var lowestResourceSensorDir;

    for (var i = 0; i < order.length; i++) {
      var j = order[i];
      var value = resourceSensors[j] || 0;
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

    if (highestPlayerSensorVal > 0 && sensors.ammo >= 5 && !critical) {
      if (highestPlayerSensorVal > 10) {
        return Universe.fireCommand((highestPlayerSensorDir + 4) % 8);
      }
      return Universe.moveCommand((highestPlayerSensorDir + 4) % 8);
    } else if (highestResourceSensorVal > 0 && critical) {
      return Universe.moveCommand((highestResourceSensorDir + 4) % 8);
    } else if (critical && highestPlayerSensorVal > 0) {
      return Universe.moveCommand((lowestPlayerSensorDir + 4) % 8);
    } else if (highestResourceSensorVal > 0) {
      return Universe.moveCommand((highestResourceSensorDir + 4) % 8);
    } else if (highestPlayerSensorVal > 0 && sensors.resource > 80) {
      return Universe.moveCommand((highestPlayerSensorVal + 4) % 8);
    } else if (Math.random() < 0.2) {
      return Universe.moveCommand(Math.floor(Math.random() * 8));
    }
  };

  Less.prototype.clone = function() {
    return new Less();
  };

  exports.Less = Less;

}(window.Brains || (window.Brains = {}));
