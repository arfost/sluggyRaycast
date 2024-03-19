const randomTint = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff', '#000000'];

const FORCE_WIREFRAME = false;
class Camera {
  constructor(canvas, resolution, focalLength) {
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width = window.innerWidth * 0.5;
    this.height = canvas.height = window.innerHeight * 0.5;
    this.resolution = resolution;
    this.spacing = this.width / resolution;
    this.focalLength = focalLength || 0.8;
    this.range = 15;
    this.lightRange = 7;
    this.weaponScale = (this.width + this.height) / 2000;
  }

  drawSky(direction, pitch, sky, ambient) {
    this.ctx.fillStyle = '#000';
    this.ctx.globalAlpha = 1;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // this.ctx.fillStyle = '#fff';
    // this.ctx.globalAlpha = ambient * 0.1;
    // this.ctx.fillRect(0, 0, this.width, this.height);

    // var width = sky.width * (this.height / sky.height) * 2;
    // var left = (direction / CIRCLE) * -width;

    // // Calculer le décalage vertical basé sur le pitch
    // // La "sensibilité" détermine l'amplitude du mouvement de la skybox en fonction du pitch
    // var top = (this.height / 2) * (1 + Math.sin(pitch)) - 0.5 * this.height;

    // this.ctx.save();
    // this.ctx.drawImage(sky.image, left, top, width, sky.height);
    // if (left < width - this.width) {
    //     this.ctx.drawImage(sky.image, left + width, top, width, sky.height);
    // }
    // this.ctx.restore();
  };

  drawWeapon(weapon, paces) {
    var bobX = Math.cos(paces * 2) * this.weaponScale * 6;
    var bobY = Math.sin(paces * 4) * this.weaponScale * 6;
    var left = this.width * 0.66 + bobX;
    var top = this.height * 0.6 + bobY;
    this.ctx.drawImage(weapon.image, left, top, weapon.width * this.weaponScale, weapon.height * this.weaponScale);
  };

  render(player, map) {
    this.drawSky(player.direction, player.upDirection, map.skybox, map.light);

    for (let offset = 15; offset > 0; offset--) {
      if (map.wallGrids[player.zLevel - offset]) {
        this.drawColumns(player, map, player.zLevel - offset, -offset, player.zRest);
      }
      if (map.wallGrids[player.zLevel + offset]) {
        this.drawColumns(player, map, player.zLevel + offset, offset, player.zRest);
      }
    }
    this.drawColumns(player, map, player.zLevel, 0, player.zRest);
    this.drawWeapon(player.weapon, player.paces);
  };

  drawColumns(player, map, layer, layerOffset, resteOffset) {
    this.ctx.save();
    for (var column = 0; column < this.resolution; column++) {
      var x = column / this.resolution - 0.5;
      var angle = Math.atan2(x, this.focalLength);
      var ray = map.cast(player, player.direction + angle, this.range, layer);
      this.drawColumn(column, ray, angle, map, layerOffset, resteOffset, player.upDirection);
    }
    this.ctx.restore();
  };

  drawTexturedColumn(s, step, ray, hit, angle, map, layerOffset, resteOffset, upDirection, left, width) {

    const blockProps = map.getBlockProperties(step.type);

    var textureX = Math.floor(blockProps.texture.width * step.offset);
    var wall = this.project(blockProps.heightRatio, angle, step.distance, layerOffset, resteOffset, upDirection);

    if (ray[s + 1]) {
      var nwall = this.project(blockProps.heightRatio, angle, ray[s + 1].distance, layerOffset, resteOffset, upDirection);

      if (nwall.top + nwall.height > wall.top + wall.height) {

        this.ctx.globalAlpha = 1;
        this.ctx.fillStyle = blockProps.tint;
        this.ctx.fillRect(left, nwall.top + nwall.height, width, (wall.top + wall.height) - (nwall.top + nwall.height));
        this.ctx.fillStyle = "#000";
        this.ctx.globalAlpha = Math.max((step.distance) / this.lightRange - map.light, 0);
        this.ctx.fillRect(left, nwall.top + nwall.height, width, (wall.top + wall.height) - (nwall.top + nwall.height));
      }
      if (nwall.top < wall.top) {

        this.ctx.globalAlpha = 1;
        this.ctx.fillStyle = blockProps.tint;
        this.ctx.fillRect(left, nwall.top, width, wall.top - nwall.top);
        this.ctx.fillStyle = "#000";
        this.ctx.globalAlpha = Math.max((step.distance) / this.lightRange - map.light, 0);
        this.ctx.fillRect(left, nwall.top, width, wall.top - nwall.top);
      }

    }

    //
    if (s <= hit) {
      this.ctx.globalAlpha = 1;
      this.ctx.drawImage(map.getBlockProperties(step.type).texture.image, textureX, 0, 1, map.getBlockProperties(step.type).texture.height, left, wall.top, width, wall.height);
      this.ctx.globalAlpha = 0.3;
      this.ctx.fillStyle = map.getBlockProperties(step.type).tint;
      this.ctx.fillRect(left, wall.top, width, wall.height);
      this.ctx.fillStyle = "#000";
      this.ctx.globalAlpha = Math.max((step.distance + step.shading) / this.lightRange - map.light, 0);
      this.ctx.fillRect(left, wall.top, width, wall.height);
    }
  };
  drawWireframeColumn(s, step, ray, hit, angle, map, layerOffset, resteOffset, upDirection, left, width) {

    const blockProps = map.getBlockProperties(step.type)

    this.ctx.globalAlpha = 0.6;
    var wall = this.project(blockProps.heightRatio, angle, step.distance, layerOffset, resteOffset, upDirection);


    if (ray[s + 1]) {
      //var ntextureX = Math.floor(map.blockProperties[step.type - 1].topTexture.width * nextStep.offset);
      var nwall = this.project(blockProps.heightRatio, angle, ray[s + 1].distance, layerOffset, resteOffset, upDirection);

      // ctx.fillStyle = "#ff0000";
      // ctx.fillRect(left, nwall.top, width, nwall.height); //back face

      if (nwall.top + nwall.height > wall.top + wall.height) {
        this.ctx.fillStyle = "#0000ff";
        this.ctx.fillRect(left, nwall.top + nwall.height, width, (wall.top + wall.height) - (nwall.top + nwall.height)); //bottom face
      }
      if (nwall.top < wall.top) {
        this.ctx.fillStyle = "#00ff00";
        this.ctx.fillRect(left, nwall.top, width, wall.top - nwall.top); //top face
      }

    }

    //
    if (s <= hit) {
      this.ctx.fillStyle = "#fff";
      this.ctx.fillRect(left, wall.top, width, wall.height);

      this.ctx.globalAlpha = Math.max((step.distance + step.shading) / this.lightRange - map.light, 0);
      this.ctx.fillRect(left, wall.top, width, wall.height);
    }
  };

  drawColumn(column, ray, angle, map, layerOffset, resteOffset, upDirection) {

    var left = Math.floor(column * this.spacing);
    var width = Math.ceil(this.spacing);
    var hit = -1;

    const isStop = (step) => {
      return (map.getBlockProperties(step.type) || {}).stop;
    }

    while (++hit < ray.length && !isStop(ray[hit]));

    // for (var s = ray.length - 1; s >= 0; s--) {
    for (var s = ray.length - 1; s >= 0; s--) {
      var step = ray[s];

      if (step.type > 0) {
        if (map.getBlockProperties(step.type).texture && !FORCE_WIREFRAME) {
          this.drawTexturedColumn(s, step, ray, hit, angle, map, layerOffset, resteOffset, upDirection, left, width);
        } else {
          
          this.drawWireframeColumn(s, step, ray, hit, angle, map, layerOffset, resteOffset, upDirection, left, width);
        }
      }
    }
  };

  project(heightRatio, angle, distance, layerOffset, resteOffset, pitch) {
    var z = (distance) * Math.cos(angle);
    var blockHeight = (this.height) * (1) / z;
    var bottom = ((this.height) / 2 * (1 + 1 / z)) // + ((blockHeight * -layerOffset) + (blockHeight / 10 * resteOffset));

    var verticalAdjustment = this.height * Math.tan(pitch);
    bottom += verticalAdjustment + ((blockHeight * -layerOffset) + (blockHeight / 10 * resteOffset));

    return {
      top: bottom - blockHeight * heightRatio,
      height: blockHeight * heightRatio
    };
  };
}