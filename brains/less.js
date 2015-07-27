!function(exports) {

  exports.Less = function(player) {
    var sensors = player.sensors.players;

    var highestSensorVal;
    var highestSensorDir;
    var lowestSensorVal;
    var lowestSensorDir;

    if (sensors) {
      for (var i = 0; i < sensors.length; i++) {
        if (sensors[i]) {
          if (!highestSensorVal || sensors[i] > highestSensorVal) {
            highestSensorVal = sensors[i];
            highestSensorDir = i;
          }
          if (!lowestSensorVal || sensors[i] > lowestSensorVal) {
            lowestSensorVal = sensors[i];
            lowestSensorDir = i;
          }
        }
      }
    }

    if (highestSensorVal) {
      if (player.ammo > 0) {
        return Universe.fireCommand((highestSensorDir + 4) % 8);
      }
      return Universe.moveCommand(lowestSensorDir);
    } else if (Math.random() < 0.2) {
      return Universe.moveCommand(Math.floor(Math.random() * 8));
    }
  };

}(window.Brains || (window.Brains = {}));
