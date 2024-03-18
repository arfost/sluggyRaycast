class Player {
  constructor(x, y, direction) {
    this.x = x;
    this.y = y;
    this.z = 0;
    this.direction = direction;
    this.upDirection = 0;
    this.weapon = new Bitmap('assets/rabbit_hand.png', 319, 320);
    this.paces = 0;
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
    if (map.get(this.x + dx, this.y, this.zLevel) <= 0) this.x += dx;
    if (map.get(this.x, this.y + dy, this.zLevel) <= 0) this.y += dy;
    this.paces += distance;
  };

  strafe(distance, map) {
    var dx = Math.cos(this.direction + Math.PI/2) * distance;
    var dy = Math.sin(this.direction + Math.PI/2) * distance;
    if (map.get(this.x + dx, this.y, this.zLevel) <= 0) this.x += dx;
    if (map.get(this.x, this.y + dy, this.zLevel) <= 0) this.y += dy;
    this.paces += distance;
  };

  fly(distance, map) {
    this.z += distance;
    if(!map.wallGrids[this.zLevel]){
      this.z-=distance;
    }
  };

  update(controls, map, seconds) {

    if (controls.left) this.strafe(-3 * seconds, map);
    if (controls.right) this.strafe(3 * seconds, map);

    if (controls.look) {
      this.rotateZ(controls.look * Math.PI * seconds * 0.1);
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
    if (controls.backward) { this.walk(-3 * seconds, map) }
  };
}
