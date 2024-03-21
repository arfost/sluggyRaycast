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

    while (++hit < ray.length && !isStop(ray[hit]));

    // for (var s = ray.length - 1; s >= 0; s--) {
    for (var s = ray.length - 1; s >= 0; s--) {
      var step = ray[s];
      let sprite = map.placeables.find(sprite => sprite.x === step.x && sprite.y === Math.floor(step.y));
      if(sprite && step.layer === sprite.z){
        // const spriteProj = this.project(1, angle, step.distance, layerOffset, player.zRest, player.upDirection);
        // const spriteProps = map.getPlaceableProperties(sprite.type);
        // var textureX = Math.floor(spriteProps.texture.width * step.offset);
        // this.ctx.globalAlpha = 1;
        // this.ctx.drawImage(spriteProps.texture.image, textureX, 0, 1, spriteProps.texture.height, left, spriteProj.top, width, spriteProj.height);
      }
      if (step.type > 0) {
        if (map.getBlockProperties(step.type).texture && !FORCE_WIREFRAME) {
          this.drawTexturedColumn(s, step, ray, hit, angle, map, layerOffset, player.zRest, player.upDirection, left, width);
        } else {

          this.drawWireframeColumn(s, step, ray, hit, angle, map, layerOffset, player.zRest, player.upDirection, left, width);
        }
      }
    }

      // map.placeables.forEach(sprite => {
      // const spriteDistance = this.getSpriteDistance(sprite, player);
      // const spriteAngle = Math.atan2(sprite.y - player.y, sprite.x - player.x) - player.direction;

      // // Assurez-vous que le sprite est devant le joueur et à une distance raisonnable
      // if (spriteDistance < ray[ray.length - 1].distance && spriteAngle > -Math.PI / 4 && spriteAngle < Math.PI / 4) {
      //     this.drawSpriteColumn(map.getPlaceableProperties(sprite.type), player, spriteAngle, spriteDistance, column);
      // }
      // });
  };

  drawSpriteColumn(sprite, player, spriteAngle, spriteDistance, column) {
    // Largeur d'une slice du sprite (peut varier selon votre design)
    const spriteWidth = sprite.texture.width; // Largeur totale du sprite
    const spriteHeight = sprite.texture.height; // Hauteur totale du sprite

    // Taille du sprite sur l'écran en fonction de la distance
    const spriteScreenHeight = this.height / spriteDistance;
    const spriteScreenWidth = (this.width / spriteDistance) * (spriteWidth / spriteHeight);

    // Calculer la position X du sprite sur l'écran
    const spriteScreenX = Math.tan(spriteAngle) * this.width;

    // Calcul de la colonne du sprite à dessiner
    const spriteColumn = Math.floor((spriteScreenX + spriteScreenWidth / 2) - (column * this.spacing));

    // Vérification pour ne dessiner que si la slice est à l'intérieur de l'image du sprite
    if (spriteColumn < 0 || spriteColumn >= spriteWidth) return;

    // Calculer la position Y du sprite sur l'écran (centré verticalement)
    const spriteScreenY = (this.height - spriteScreenHeight) / 2;

    // Dessiner la slice de sprite
    this.ctx.drawImage(sprite.texture.image,
      spriteColumn, 0, 1, spriteHeight,
      column * this.spacing, spriteScreenY,
      this.spacing, spriteScreenHeight);
  }

  drawSpritesAgainTest(player, sprites) {
    //SPRITE CASTING
    // if (frameCount == 1 || frameCount % 4 == 0) {
    //   for (var i=0; i<whichSprites.length; i++) { //Calculate sprite distances and reset order
    //     whatOrder[i] = i;
    //     spriteDistance[i] = ((whichCamera.posX - whichSprites[i].x) * (whichCamera.posX - whichSprites[i].x)) + ((whichCamera.posY - whichSprites[i].y) * (whichCamera.posY - whichSprites[i].y));
    //   }
    //   combSort(whatOrder, spriteDistance, whichSprites.length); //Sort sprites by distance from the camera
    // }
    
    var tp = -1;
    if (tpWalls.length > 0) {
      tp = tpWalls.length - 1;
    }
    for (var i=0; i<sprites.length; i++) {
      var spriteX = sprites[i].x - player.x;
      var spriteY = sprites[i].y - player.z;
      
      var invDet = 1.0 / (whichCamera.planeX * whichCamera.dirY - whichCamera.dirX * whichCamera.planeY);
      var transformX = invDet * (whichCamera.dirY * spriteX - whichCamera.dirX * spriteY);
      var transformY = invDet * (-whichCamera.planeY * spriteX + whichCamera.planeX * spriteY);
  
      if (transformY > 0) { //No need for the rest if the sprite is behind the player
        for (tp; tp>=0; tp--) {
          var tpDist = ((whichCamera.posX - tpWalls[tp].mapX)*(whichCamera.posX - tpWalls[tp].mapX)) + ((whichCamera.posY - tpWalls[tp].mapY) * (whichCamera.posY - tpWalls[tp].mapY));
          if (spriteDistance[i] < tpDist) {
            tpWalls[tp].draw();
          } else {
            break;
          }
        }
  
        var spriteHeight = Math.abs(Math.floor(h/transformY));
        var drawStartY = -spriteHeight / 2 + hHalf;
  
        var spriteScreenX = Math.floor(w/2) * (1 + transformX / transformY);
        var spriteWidth = Math.abs(Math.floor(h / transformY));
        var drawStartX = Math.floor(-spriteWidth / 2 + spriteScreenX);
        var drawEndX = drawStartX + spriteWidth;
        
        var clipStartX = drawStartX;
        var clipEndX = drawEndX;
  
        if (drawStartX < -spriteWidth) {
          drawStartX = -spriteWidth;
        }
        if (drawEndX > w + spriteWidth) {
          drawEndX = w + spriteWidth;
        }
  
        for (var stripe=drawStartX; stripe<=drawEndX; stripe++) {
          if (transformY > whichZBuffer[stripe]) {
            if (stripe - clipStartX <= 1) { //Detect leftmost obstruction
              clipStartX = stripe;
            } else {
              clipEndX = stripe; //Detect rightmost obstruction
              break;
            }
          }	
        }
        
        if (clipStartX != clipEndX && clipStartX < w && clipEndX > 0) { //Make sure the sprite is not fully obstructed or off screen
          var scaleDelta = whichSprites[whatOrder[i]].width / spriteWidth;
          var drawXStart = Math.floor((clipStartX - drawStartX) * scaleDelta);
          if (drawXStart < 0) {
            drawXStart = 0;
          }
          var drawXEnd = Math.floor((clipEndX - clipStartX) * scaleDelta) + 1;
          if (drawXEnd > whichSprites[whatOrder[i]].width) {
            drawEndX = whichSprites[whatOrder[i]].width;
          }
          var drawWidth = clipEndX - clipStartX;
          if (drawWidth < 0) {
            drawWidth = 0;
          }
          var drawAng = Math.atan2(spriteY, spriteX);
          whichSprites[whatOrder[i]].updateSpriteRotation(drawAng);
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(whichSprites[whatOrder[i]].pic, drawXStart, 0, drawXEnd, whichSprites[whatOrder[i]].height, clipStartX, drawStartY, drawWidth, spriteHeight);
          ctx.restore();
        }
      }
    }//End of spriteList for loop
  
    for (tp; tp >= 0; tp--) {//Draw the remaining transparent walls
      tpWalls[tp].draw();
    }
    tpWalls.length = 0;
  }//End of drawSprites

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

  drawSprites(player, map) {
    const sprites = map.placeables;
    // Calculate distance from the player to each sprite
    sprites.forEach(sprite => {
      const dx = sprite.x - player.x;
      const dy = sprite.y - player.y;
      sprite.distance = Math.sqrt(dx * dx + dy * dy);
      sprite.angle = Math.atan2(dy, dx) - player.direction;
    });

    // Sort sprites by distance in descending order
    sprites.sort((a, b) => b.distance - a.distance);

    // Draw each sprite
    sprites.forEach(sprite => {
      // for(let i = 0; i < this.resolution; i++){
      //   // Only draw sprites that are within the player's field of view
      //   this.drawSpriteColumn(map.getPlaceableProperties(sprite.type), player, sprite.angle, sprite.distance, i);
      // }
      this.drawSprite(player, sprite, map);
    });
  }

  getSpriteDistance(sprite, player) {
    const dx = sprite.x - player.x;
    const dy = sprite.y - player.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  drawSprite(player, sprite, map) {
    // Adjust sprite angle within the range of -PI to PI
    let spriteAngle = sprite.angle;
    while (spriteAngle < -Math.PI) spriteAngle += 2 * Math.PI;
    while (spriteAngle > Math.PI) spriteAngle -= 2 * Math.PI;

    
    if (sprite.angle > this.focalLength || sprite.angle < -this.focalLength) return;

    const spriteInfos = map.getPlaceableProperties(sprite.type);

    const spriteDistance = sprite.distance;
    const spriteSize = this.height / spriteDistance; // Adjust size based on distance
    const spriteX = Math.tan(spriteAngle) * this.width;

    const spriteScreenColumn = Math.floor(spriteX / this.spacing);

    if(this.zBuffer[spriteScreenColumn] < spriteDistance) return;

    // Calculate the top position based on sprite's z position (height)
    // Adjust sprite drawing based on its z value and player's pitch
    const verticalAdjustment = this.height * Math.tan(player.upDirection);
    const spriteTop = (this.height / 2) * (1 + 1 / spriteDistance) + verticalAdjustment - (spriteSize * sprite.z);

    // Assuming sprite.texture is an Image object
    this.ctx.drawImage(spriteInfos.texture.image, this.width / 2 + spriteX - spriteSize / 2, spriteTop, spriteSize, spriteSize);
  }

}