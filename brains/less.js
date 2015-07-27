!function(exports) {

  function shuffle(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
  }

  exports.Less = function(player) {
    var playerSensors = player.sensors.players || [];

    var order = [0, 1, 2, 3, 4, 5, 6, 7];
    shuffle(order);

    var highestPlayerSensorVal;
    var highestPlayerSensorDir;
    var lowestPlayerSensorVal;
    var lowestPlayerSensorDir;

    for (var i = 0; i < order.length; i++) {
      var j = order[i];
      var value = playerSensors[j] || 0;
      if (!highestPlayerSensorVal || value > highestPlayerSensorVal) {
        highestPlayerSensorVal = value;
        highestPlayerSensorDir = j;
      }
      if (!lowestPlayerSensorVal || value < lowestPlayerSensorVal) {
        lowestPlayerSensorVal = value;
        lowestPlayerSensorDir = j;
      }
    }

    var resourceSensors = player.sensors.resources || [];

    var highestResourceSensorVal;
    var highestResourceSensorDir;
    var lowestResourceSensorVal;
    var lowestResourceSensorDir;

    for (var i = 0; i < order.length; i++) {
      var j = order[i];
      var value = resourceSensors[j] || 0;
      if (!highestResourceSensorVal || value > highestResourceSensorVal) {
        highestResourceSensorVal = value;
        highestResourceSensorDir = j;
      }
      if (!lowestResourceSensorVal || value < lowestResourceSensorVal) {
        lowestResourceSensorVal = value;
        lowestResourceSensorDir = j;
      }
    }

    var movePoints;
    var firePoints;

    var critical = player.health <= 40;

    if (highestPlayerSensorVal > 0 && player.ammo > 0 && !critical) {
      return Universe.fireCommand((highestPlayerSensorDir + 4) % 8);
    } else if (highestResourceSensorVal > 0 && critical) {
      return Universe.moveCommand((highestResourceSensorDir + 4) % 8);
    } else if (critical && lowestPlayerSensorVal === 0) {
      return Universe.moveCommand((lowestPlayerSensorDir + 4) % 8);
    } else if (highestResourceSensorVal > 0 && player.health < 100) {
      return Universe.moveCommand((highestResourceSensorDir + 4) % 8);
    } else if (lowestPlayerSensorDir === 0) {
      return Universe.moveCommand((lowestPlayerSensorDir + 4) % 8);
    } else if (Math.random() < 0.2) {
      return Universe.moveCommand(Math.floor(Math.random() * 8));
    }
  };

}(window.Brains || (window.Brains = {}));
