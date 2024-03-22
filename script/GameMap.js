class GameMap {
  constructor(mapLoader, startCoord) {
    this.mapLoader = mapLoader;
    this.size = mapLoader.mapInfos.size;
    this.light = 3;
    this.skybox = new Bitmap('assets/skybox.jpg', 2000, 750);

    this.placeables = mapLoader.placeables;

    const chunkCoord = this.playerCoordToMapCoord(startCoord);
    this.ready = this.mapLoader.loadChunk(chunkCoord.x-mapLoader.CHUNK_SIZE, chunkCoord.y-mapLoader.CHUNK_SIZE, chunkCoord.z-mapLoader.CHUNK_SIZE, mapLoader.CHUNK_SIZE*2+1);

    const chunkLength = mapLoader.BLOCK_SIZE * (mapLoader.CHUNK_SIZE);
    const chunkLengthZ = 10*mapLoader.BLOCK_SIZE_Z * (mapLoader.CHUNK_SIZE);

    this.nextChunks = {
      xMin: startCoord.x - chunkLength/2,
      xMax: startCoord.x + chunkLength/2,
      yMin: startCoord.y - chunkLength/2,
      yMax: startCoord.y + chunkLength/2,
      zMin: startCoord.z - chunkLengthZ/2,
      zMax: startCoord.z + chunkLengthZ/2,
      chunkLength,
      chunkLengthZ
    }
    console.log("chunks init", this.nextChunks);

    this.blockProperties = mapLoader.blockProperties.blockDefinition;
    this.placeableProperties = mapLoader.placeableProperties.placeableDefinition;
  }

  get wallGrids(){
    return this.mapLoader.map;
  }

  getBlockProperties(key) {
    return this.blockProperties[key] ? this.blockProperties[key] : this.blockProperties[0];
  }

  getPlaceableProperties(key) {
    return this.placeableProperties[key] ? this.placeableProperties[key] : this.placeableProperties[0];
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
      x: Math.floor(player.x / this.mapLoader.BLOCK_SIZE),
      y: Math.floor(player.y / this.mapLoader.BLOCK_SIZE),
      z: Math.floor(player.z / 10 / this.mapLoader.BLOCK_SIZE_Z)
    }
  }

  getNextChunks(direction, player) {
    const chunkCoord = this.playerCoordToMapCoord(player);
    console.log("getNextChunks", direction, JSON.stringify(this.nextChunks, null, 4), {x: player.x, y: player.y, z: player.z}, JSON.stringify(chunkCoord, null, 4));
    switch (direction) {
      case "up":
        chunkCoord.z += this.mapLoader.CHUNK_SIZE*2;
        this.nextChunks.zMax += this.nextChunks.chunkLengthZ;
        break;
      case "down":
        chunkCoord.z -= this.mapLoader.CHUNK_SIZE*2;
        this.nextChunks.zMin -= this.nextChunks.chunkLengthZ;
        break;
      case "forward":
        chunkCoord.x += this.mapLoader.CHUNK_SIZE*2;
        this.nextChunks.xMax += this.nextChunks.chunkLength;
        break;
      case "backward":
        chunkCoord.x -= this.mapLoader.CHUNK_SIZE*2;
        this.nextChunks.xMin -= this.nextChunks.chunkLength;
        break;
      case "left":
        chunkCoord.y += this.mapLoader.CHUNK_SIZE*2;
        this.nextChunks.yMax += this.nextChunks.chunkLength;
        break;
      case "right":
        chunkCoord.y -= this.mapLoader.CHUNK_SIZE*2;
        this.nextChunks.yMin -= this.nextChunks.chunkLength;
        break;
    }
    console.log("getNextChunks after", direction, JSON.stringify(this.nextChunks, null, 4), JSON.stringify(chunkCoord, null, 4));
    
    this.mapLoader.loadChunk(chunkCoord.x-this.mapLoader.CHUNK_SIZE, chunkCoord.y-this.mapLoader.CHUNK_SIZE, chunkCoord.z-this.mapLoader.CHUNK_SIZE, this.mapLoader.CHUNK_SIZE*2+1);
    
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

