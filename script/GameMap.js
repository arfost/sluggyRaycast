class GameMap {
  constructor(mapLoader, startCoord) {
    this.mapLoader = mapLoader;
    this.size = mapLoader.mapInfos.size;
    this.light = 3;

    const chunkCoord = this.playerCoordToMapCoord(startCoord);
    this.mapLoader.loadChunk(chunkCoord.x-DfMapLoader.CHUNK_SIZE, chunkCoord.y-DfMapLoader.CHUNK_SIZE, chunkCoord.z-DfMapLoader.CHUNK_SIZE, DfMapLoader.CHUNK_SIZE*2+1);

    const chunkLength = DfMapLoader.BLOCK_SIZE * (DfMapLoader.CHUNK_SIZE * 2 +1);
    const chunkLengthZ = 10*DfMapLoader.BLOCK_SIZE_Z * (DfMapLoader.CHUNK_SIZE * 2 +1);

    this.nextChunks = {
      xMin: startCoord.x - chunkLength/4,
      xMax: startCoord.x + chunkLength/4,
      yMin: startCoord.y - chunkLength/4,
      yMax: startCoord.y + chunkLength/4,
      zMin: startCoord.z - chunkLengthZ/4,
      zMax: startCoord.z + chunkLengthZ/4,
      chunkLength,
      chunkLengthZ
    }
    console.log("chunks init", this.nextChunks);

    this.blockProperties = [{
      heightRatio: 1,
      stop: false,
      passable: true,
      walkable: true,
    },{
      texture: new Bitmap('assets/smooth_wall.png', 256, 256),
      heightRatio: 0.02,
      tint: '#ff6600',
      stop: false,
      passable: true,
      walkable: true,
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

  get wallGrids(){
    return this.mapLoader.map;
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

  playerCoordToMapCoord(player) {
    return {
      x: Math.floor(player.x / DfMapLoader.BLOCK_SIZE),
      y: Math.floor(player.y / DfMapLoader.BLOCK_SIZE),
      z: Math.floor(player.z / 10 / DfMapLoader.BLOCK_SIZE_Z)
    }
  }

  getNextChunks(direction, player) {
    const chunkCoord = this.playerCoordToMapCoord(player);
    console.log("getNextChunks", direction, JSON.stringify(this.nextChunks, null, 4), {x: player.x, y: player.y, z: player.z}, JSON.stringify(chunkCoord, null, 4));
    switch (direction) {
      case "up":
        chunkCoord.z += DfMapLoader.CHUNK_SIZE*2;
        this.nextChunks.zMax += this.nextChunks.chunkLengthZ/2;
        break;
      case "down":
        chunkCoord.z -= DfMapLoader.CHUNK_SIZE*2;
        this.nextChunks.zMin -= this.nextChunks.chunkLengthZ/2;
        break;
      case "forward":
        chunkCoord.x += DfMapLoader.CHUNK_SIZE*2;
        this.nextChunks.xMax += this.nextChunks.chunkLength/2;
        break;
      case "backward":
        chunkCoord.x -= DfMapLoader.CHUNK_SIZE*2;
        this.nextChunks.xMin -= this.nextChunks.chunkLength/2;
        break;
      case "left":
        chunkCoord.y += DfMapLoader.CHUNK_SIZE*2;
        this.nextChunks.yMax += this.nextChunks.chunkLength/2;
        break;
      case "right":
        chunkCoord.y -= DfMapLoader.CHUNK_SIZE*2;
        this.nextChunks.yMin -= this.nextChunks.chunkLength/2;
        break;
    }
    console.log("getNextChunks after", direction, JSON.stringify(this.nextChunks, null, 4), JSON.stringify(chunkCoord, null, 4));
    
    this.mapLoader.loadChunk(chunkCoord.x-DfMapLoader.CHUNK_SIZE, chunkCoord.y-DfMapLoader.CHUNK_SIZE, chunkCoord.z-DfMapLoader.CHUNK_SIZE, DfMapLoader.CHUNK_SIZE*2+1);
    
  }

  update(seconds, player) {
    if(player.y> this.nextChunks.yMax){
      this.getNextChunks("left", player);
    }
    if(player.y< this.nextChunks.yMin){
      this.getNextChunks("right", player);
    }
    if(player.x> this.nextChunks.xMax){
      this.getNextChunks("forward", player);
    }
    if(player.x< this.nextChunks.xMin){
      this.getNextChunks("backward", player);
    }
    if(player.z> this.nextChunks.zMax){
      this.getNextChunks("up", player);
    }
    if(player.z< this.nextChunks.zMin){
      this.getNextChunks("down", player);
    }
  }
}

