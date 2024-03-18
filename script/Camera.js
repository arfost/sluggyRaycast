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

  drawSky(direction, sky, ambient) {
    var width = sky.width * (this.height / sky.height) * 2;
    var left = (direction / CIRCLE) * -width;

    this.ctx.save();
    this.ctx.drawImage(sky.image, left, 0, width, this.height);
    if (left < width - this.width) {
      this.ctx.drawImage(sky.image, left + width, 0, width, this.height);
    }
    if (ambient > 0) {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.globalAlpha = ambient * 0.1;
      this.ctx.fillRect(0, this.height * 0.5, this.width, this.height * 0.5);
    }
    this.ctx.restore();
  };

  drawWeapon(weapon, paces) {
    var bobX = Math.cos(paces * 2) * this.weaponScale * 6;
    var bobY = Math.sin(paces * 4) * this.weaponScale * 6;
    var left = this.width * 0.66 + bobX;
    var top = this.height * 0.6 + bobY;
    this.ctx.drawImage(weapon.image, left, top, weapon.width * this.weaponScale, weapon.height * this.weaponScale);
  };

  render(player, map) {
    this.drawSky(player.direction, map.skybox, map.light);

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
    var ctx = this.ctx;

    var textureX = Math.floor(map.blockProperties[step.type - 1].texture.width * step.offset);
    var wall = this.project(map.blockProperties[step.type - 1].heightRatio, angle, step.distance, layerOffset, resteOffset, upDirection);

    if (ray[s + 1]) {
      var nwall = this.project(map.blockProperties[step.type - 1].heightRatio, angle, ray[s + 1].distance, layerOffset, resteOffset, upDirection);

      if (nwall.top + nwall.height > wall.top + wall.height) {

        ctx.globalAlpha = 1;
        ctx.fillStyle = map.blockProperties[step.type - 1].tint;
        ctx.fillRect(left, nwall.top + nwall.height, width, (wall.top + wall.height) - (nwall.top + nwall.height));
        ctx.fillStyle = "#000";
        ctx.globalAlpha = Math.max((step.distance) / this.lightRange - map.light, 0);
        ctx.fillRect(left, nwall.top + nwall.height, width, (wall.top + wall.height) - (nwall.top + nwall.height));
      }
      if (nwall.top < wall.top) {

        ctx.globalAlpha = 1;
        ctx.fillStyle = map.blockProperties[step.type - 1].tint;
        ctx.fillRect(left, nwall.top, width, wall.top - nwall.top);
        ctx.fillStyle = "#000";
        ctx.globalAlpha = Math.max((step.distance) / this.lightRange - map.light, 0);
        ctx.fillRect(left, nwall.top, width, wall.top - nwall.top);
      }

    }

    //
    if (s <= hit) {
      ctx.globalAlpha = 1;
      ctx.drawImage(map.blockProperties[step.type - 1].texture.image, textureX, 0, 1, map.blockProperties[step.type - 1].texture.height, left, wall.top, width, wall.height);
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = map.blockProperties[step.type - 1].tint;
      ctx.fillRect(left, wall.top, width, wall.height);
      ctx.fillStyle = "#000";
      ctx.globalAlpha = Math.max((step.distance + step.shading) / this.lightRange - map.light, 0);
      ctx.fillRect(left, wall.top, width, wall.height);
    }
  };
  drawWireframeColumn(s, step, ray, hit, angle, map, layerOffset, resteOffset, upDirection, left, width) {
    var ctx = this.ctx;
    ctx.globalAlpha = 0.6;
    var wall = this.project(map.blockProperties[step.type - 1].heightRatio, angle, step.distance, layerOffset, resteOffset, upDirection);


    if (ray[s + 1]) {
      //var ntextureX = Math.floor(map.blockProperties[step.type - 1].topTexture.width * nextStep.offset);
      var nwall = this.project(map.blockProperties[step.type - 1].heightRatio, angle, ray[s + 1].distance, layerOffset, resteOffset, upDirection);

      ctx.fillStyle = "#ff0000";
      ctx.fillRect(left, nwall.top, width, nwall.height); //back face

      if (nwall.top + nwall.height > wall.top + wall.height) {
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(left, nwall.top + nwall.height, width, (wall.top + wall.height) - (nwall.top + nwall.height)); //bottom face
      }
      if (nwall.top < wall.top) {
        ctx.fillStyle = "#00ff00";
        ctx.fillRect(left, nwall.top, width, wall.top - nwall.top); //top face
      }

    }

    //
    if (s <= hit) {
      ctx.fillStyle = "#fff";
      ctx.fillRect(left, wall.top, width, wall.height);

      ctx.globalAlpha = Math.max((step.distance + step.shading) / this.lightRange - map.light, 0);
      ctx.fillRect(left, wall.top, width, wall.height);
    }
  };

  drawColumn(column, ray, angle, map, layerOffset, resteOffset, upDirection) {
    var ctx = this.ctx;

    var left = Math.floor(column * this.spacing);
    var width = Math.ceil(this.spacing);
    var hit = -1;

    const isStop = (step) => {
      return (map.blockProperties[step.type - 1] || {}).stop;
    }

    while (++hit < ray.length && !isStop(ray[hit]));

    // for (var s = ray.length - 1; s >= 0; s--) {
    for (var s = ray.length - 1; s >= 0; s--) {
      var step = ray[s];

      if (step.type > 0) {
        if (map.blockProperties[step.type - 1].texture && !FORCE_WIREFRAME) {
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
    var bottom = ((this.height) / 2 * (1 + 1 / z)) + ((blockHeight * -layerOffset) + (blockHeight / 10 * resteOffset));

    return {
      top: bottom - blockHeight * heightRatio,
      height: blockHeight * heightRatio
    };
  };
}