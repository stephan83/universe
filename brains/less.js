!function(exports) {

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

  Less.prototype.clone = function() {
    return new Less();
  };

  exports.Less = Less;

}(window.Brains || (window.Brains = {}));
