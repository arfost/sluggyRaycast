
const layerRef = [];




class GameMap {
  constructor({map, mapInfos}) {
    this.size = mapInfos.size;
    this.wallGrids = map;
    this.light = 3;

    console.log('map', map, this.wallGrids.length);

    this.blockProperties = [{
      heightRatio: 1,
      tint: '#ff6600',
      stop: false,
    },{
      texture: new Bitmap('assets/smooth_wall.png', 256, 256),
      heightRatio: 0.02,
      tint: '#ff6600',
      stop: false,
    },{
      texture: new Bitmap('assets/boulder_wall.png', 256, 256),
      heightRatio: 1,
      tint: '#ff6600',
      stop: true,
    },{
      texture: new Bitmap('assets/stone_wall.png', 256, 256),
      heightRatio: 1,
      tint: '#ff6600',
      stop: true,
    },{
      texture: new Bitmap('assets/block_wall.png', 256, 256),
      heightRatio: 1,
      tint: '#ff6600',
      stop: true,
    }]
  }

  getBlockProperties(key) {
    return this.blockProperties[key] ? this.blockProperties[key] : this.blockProperties[0];
  }

  get(x, y, z) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || x > this.size - 1 || y < 0 || y > this.size - 1) return -1;
    return this.wallGrids[z][y * this.size.x + x];
  };

  cast(point, angle, range, layer) {
    var self = this;
    var sin = Math.sin(angle);
    var cos = Math.cos(angle);
    var noWall = { length2: Infinity };

    return ray({ x: point.x, y: point.y, type: 0, distance: 0, layer: layer});

    function ray(origin) {
      var stepX = step(sin, cos, origin.x, origin.y);
      var stepY = step(cos, sin, origin.y, origin.x, true);
      var nextStep = stepX.length2 < stepY.length2
        ? inspect(stepX, 1, 0, origin.distance, stepX.y, origin.layer)
        : inspect(stepY, 0, 1, origin.distance, stepY.x, origin.layer);

      if (nextStep.distance > range) return [origin];
      return [origin].concat(ray(nextStep));
    }

    function step(rise, run, x, y, inverted) {
      if (run === 0) return noWall;
      var dx = run > 0 ? Math.floor(x + 1) - x : Math.ceil(x - 1) - x;
      var dy = dx * (rise / run);
      return {
        x: inverted ? y + dy : x + dx,
        y: inverted ? x + dx : y + dy,
        length2: dx * dx + dy * dy
      };
    }

    function inspect(step, shiftX, shiftY, distance, offset, layer) {
      var dx = cos < 0 ? shiftX : 0;
      var dy = sin < 0 ? shiftY : 0;
      step.type = self.get(step.x - dx, step.y - dy, layer);
      step.distance = distance + Math.sqrt(step.length2);
      if (shiftX) step.shading = cos < 0 ? 2 : 0;
      else step.shading = sin < 0 ? 2 : 1;
      step.offset = offset - Math.floor(offset);
      step.layer = layer;
      return step;
    }
  };

  update(seconds) {};
}

