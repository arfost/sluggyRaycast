class Player {
  constructor({x, y, z}, direction) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.direction = direction;
    this.upDirection = 0;
    this.weapon = new Bitmap('assets/rabbit_hand.png', 319, 320);
    this.paces = 0;
    this.lastValidPosition = { x: this.x, y: this.y, z: this.z };
  }

  rotate(angle) {
    this.direction = (this.direction + angle + CIRCLE) % (CIRCLE);
  };

  rotateZ(angle) {
    this.upDirection = (this.upDirection + angle + CIRCLE) % (CIRCLE);
  };

  get zLevel() {
    return Math.floor(this.z/10);
  }

  get zRest() {
    return this.z % 10;
  }

  walk(distance, map) {
    var dx = Math.cos(this.direction) * distance;
    var dy = Math.sin(this.direction) * distance;
    this.x += dx;
    this.y += dy;
    this.paces += distance;
    
  };

  strafe(distance, map) {
    var dx = Math.cos(this.direction + Math.PI/2) * distance;
    var dy = Math.sin(this.direction + Math.PI/2) * distance;
    this.x += dx;
    this.y += dy;
    this.paces += distance;
  };

  fly(distance, map) {
    this.z += distance;
    if(!map.wallGrids[this.zLevel]){
      this.z-=distance;
    }
  };

  physique(seconds, map) {
    const currentBlock = map.getBlockProperties(map.get(this.x, this.y, this.zLevel));
    if (!currentBlock.passable) {
      this.x = this.lastValidPosition.x;
      this.y = this.lastValidPosition.y;
      this.z = this.lastValidPosition.z;
      return;
    }
    if(this.zRest > 1 || (!currentBlock.walkable && map.getBlockProperties(map.get(this.x, this.y, this.zLevel-1)).passable)) {
      this.z -= 15*seconds;
    }
    this.lastValidPosition.x = this.x;
    this.lastValidPosition.y = this.y;
    this.lastValidPosition.z = this.z;
  }

  update(controls, map, seconds) {

    if (controls.left) this.strafe(-3 * seconds, map);
    if (controls.right) this.strafe(3 * seconds, map);

    if (controls.look) {
      this.rotateZ(controls.look * Math.PI * seconds * 0.05);
      controls.look = 0;
    };
    if (controls.turn) {
      this.rotate(controls.turn * Math.PI * seconds * 0.05);
      controls.turn = 0;
    };

    if (controls.up) {
      this.fly(30 * seconds, map)
    }
    if (controls.down) { 
      this.fly(-30 * seconds, map) 
    } 

    if (controls.forward) { this.walk(3 * seconds, map) } 
    if (controls.backward) { 
      this.walk(-3 * seconds, map);
      console.log("position : ", this.x, this.y, this.z, "zLevel : ", this.zLevel, "zRest : ", this.zRest);
    }
    this.physique(seconds, map);
  };
}
