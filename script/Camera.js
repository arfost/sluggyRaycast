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
    this.zBuffer = new Array(this.resolution);
  }

  drawSky(direction, pitch, sky, ambient) {
    // this.ctx.fillStyle = '#000';
    // this.ctx.globalAlpha = 1;
    // this.ctx.fillRect(0, 0, this.width, this.height);



    var width = sky.width * (this.height / sky.height) * 2;
    var left = (direction / CIRCLE) * -width;

    // Calculer le décalage vertical basé sur le pitch
    // La "sensibilité" détermine l'amplitude du mouvement de la skybox en fonction du pitch
    var top = (this.height / 2) * (1 + Math.sin(pitch)) - 0.5 * this.height;

    this.ctx.drawImage(sky.image, left, top, width, sky.height);
    if (left < width - this.width) {
      this.ctx.drawImage(sky.image, left + width, top, width, sky.height);
    }

    this.ctx.fillStyle = '#fff';
    this.ctx.globalAlpha = ambient * 0.1;
    this.ctx.fillRect(0, 0, this.width, this.height);
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
    this.ctx.globalAlpha = 1;
    this.drawSprites(player, map);
    this.drawWeapon(player.weapon, player.paces);
  };

  drawColumns(player, map, layer, layerOffset, resteOffset) {
    this.ctx.save();
    for (var column = 0; column < this.resolution; column++) {
      var x = column / this.resolution - 0.5;
      var angle = Math.atan2(x, this.focalLength);
      var ray = map.cast(player, player.direction + angle, this.range, layer);
      this.drawColumn(column, ray, angle, map, layerOffset, player);
    }
    this.ctx.restore();
  };

  drawTexturedColumn(s, step, ray, hit, angle, map, layerOffset, resteOffset, upDirection, left, width) {

    const blockProps = map.getBlockProperties(step.type);

    var wall = this.project(blockProps.heightRatio, angle, step.distance, layerOffset, resteOffset, upDirection);

    if (ray[s + 1]) {
      var nwall = this.project(blockProps.heightRatio, angle, ray[s + 1].distance, layerOffset, resteOffset, upDirection);

      if (nwall.top + nwall.height > wall.top + wall.height) {

        this.ctx.globalAlpha = 1;
        this.ctx.fillStyle = blockProps.tint || "#fff";
        this.ctx.fillRect(left, nwall.top + nwall.height, width, (wall.top + wall.height) - (nwall.top + nwall.height));
        this.ctx.fillStyle = "#000";
        this.ctx.globalAlpha = Math.max((step.distance) / this.lightRange - map.light, 0);
        this.ctx.fillRect(left, nwall.top + nwall.height, width, (wall.top + wall.height) - (nwall.top + nwall.height));
      }
      if (nwall.top < wall.top) {

        this.ctx.globalAlpha = 1;
        this.ctx.fillStyle = blockProps.tint || "#fff";
        this.ctx.fillRect(left, nwall.top, width, wall.top - nwall.top);
        this.ctx.fillStyle = "#000";
        this.ctx.globalAlpha = Math.max((step.distance) / this.lightRange - map.light, 0);
        this.ctx.fillRect(left, nwall.top, width, wall.top - nwall.top);
      }

    }

    //
    if (s <= hit) {
      var textureX = Math.floor(blockProps.texture.width * step.offset);
      this.ctx.globalAlpha = 1;
      this.ctx.drawImage(blockProps.texture.image, textureX, 0, 1, blockProps.texture.height, left, wall.top, width, wall.height);
      this.ctx.globalAlpha = 0.3;
      this.ctx.fillStyle = blockProps.tint || "#fff";
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

  drawColumn(column, ray, angle, map, layerOffset, player) {

    var left = Math.floor(column * this.spacing);
    var width = Math.ceil(this.spacing);
    var hit = -1;

    const isStop = (step) => {
      return (map.getBlockProperties(step.type) || {}).stop;
    }

    while (++hit < ray.length-1 && !isStop(ray[hit]));

    this.zBuffer[column] = ray[hit].distance;

    // for (var s = ray.length - 1; s >= 0; s--) {
    for (var s = ray.length - 1; s >= 0; s--) {
      var step = ray[s];
      if (step.type > 0) {
        if (map.getBlockProperties(step.type).texture && !FORCE_WIREFRAME) {
          this.drawTexturedColumn(s, step, ray, hit, angle, map, layerOffset, player.zRest, player.upDirection, left, width);
        } else {

          this.drawWireframeColumn(s, step, ray, hit, angle, map, layerOffset, player.zRest, player.upDirection, left, width);
        }
      }
    }
  };

  project(heightRatio, angle, distance, layerOffset, resteOffset, pitch) {
    var z = (distance) * Math.cos(angle);
    var blockHeight = (this.height) * (1) / z;
    var bottom = (this.height / 2 * (1 + 1 / z)) // + ((blockHeight * -layerOffset) + (blockHeight / 10 * resteOffset));

    var verticalAdjustment = this.height * Math.tan(pitch);
    bottom += verticalAdjustment + ((blockHeight * -layerOffset) + (blockHeight / 10 * resteOffset));

    return {
      top: bottom - blockHeight * heightRatio,
      height: blockHeight * heightRatio
    };
  };

  drawSprites(player, map) {
    const sprites = map.placeables[player.zLevel];
    // Calculate distance from the player to each sprite
    sprites.forEach(sprite => {
      const dx = sprite.x - player.x;
      const dy = sprite.y - player.y;
      sprite.distance = Math.sqrt(dx * dx + dy * dy);
      sprite.angle = Math.atan2(dy, dx) - player.direction;
      while (sprite.angle < -Math.PI) sprite.angle += 2 * Math.PI;
      while (sprite.angle > Math.PI) sprite.angle -= 2 * Math.PI;
    });

    // Sort sprites by distance in descending order
    sprites.sort((a, b) => b.distance - a.distance);

    // Draw each sprite
    sprites.forEach(sprite => {
      if(sprite.distance>this.range) return;
      if (sprite.angle < -this.focalLength || sprite.angle > this.focalLength) {
        // Le sprite est hors du champ de vision, ne pas le dessiner
        return;
      }
      this.drawSprite(player, sprite, map);
    });
  }

  getSpriteDistance(sprite, player) {
    const dx = sprite.x - player.x;
    const dy = sprite.y - player.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  drawSprite(player, sprite, map) {
    
    var columnWidth = this.spacing;
    let spriteAngle = sprite.angle;

    const spriteInfos = map.getPlaceableProperties(sprite.type);

    const spriteDistance = sprite.distance;
    const spriteSize = (this.height*spriteInfos.heightRatio) * 1/spriteDistance; // Adjust size based on distance
    const spriteX = Math.tan(spriteAngle) * (this.width-spriteSize);

    const verticalAdjustment = this.height * Math.tan(player.upDirection);
    const spriteTop = ((this.height-spriteSize)/2 ) * (1 + 0.5 / (spriteDistance)) + verticalAdjustment;

    const columnCount = spriteSize / columnWidth;
    for(let i = 0; i < columnCount; i++){
      const adjustedX = this.width/2 + spriteX - spriteSize/2 + i * columnWidth;
      const spriteScreenColumn = Math.floor( adjustedX / this.spacing);
      var left = spriteScreenColumn * this.spacing;
      if(this.zBuffer[spriteScreenColumn] < spriteDistance) continue;
      
      const textureX = spriteInfos.texture.width * i / columnCount;
      this.ctx.drawImage(spriteInfos.texture.image, textureX, 0, columnWidth+1, spriteInfos.texture.height, left, spriteTop, columnWidth, spriteSize);
    } 
  }
}