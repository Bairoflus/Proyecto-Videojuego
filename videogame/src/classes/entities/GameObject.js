/**
 * Base GameObject class
 * Foundation for all game objects with position, size, sprite rendering,
 * and basic collision detection via hitboxes
 */
import { variables } from "../../config.js";
import { Rect } from "../../utils/Rect.js";
import { PHYSICS_CONSTANTS } from "../../constants/gameConstants.js";

export class GameObject {
  constructor(position, width, height, color, type) {
    this.position = position;
    this.width = width;
    this.height = height;
    this.color = color;
    this.type = type;

    // Initialize hitbox with default values from constants
    this.hitbox = {
      width: width * PHYSICS_CONSTANTS.DEFAULT_HITBOX_SCALE,
      height: height * PHYSICS_CONSTANTS.DEFAULT_HITBOX_SCALE,
      offsetX: width * 0.2, // Centers the hitbox horizontally (20% margin on each side)
      offsetY: height * 0.2, // Centers the hitbox vertically (20% margin on each side)
    };
  }

  setSprite(imagePath, rect) {
    this.spriteImage = new Image();
    this.spriteImage.src = imagePath;
    if (rect) this.spriteRect = rect;
  }

  draw(ctx) {
    // Draw sprite
    if (this.spriteImage) {
      if (this.spriteRect) {
        ctx.drawImage(
          this.spriteImage,
          this.spriteRect.x * this.spriteRect.width,
          this.spriteRect.y * this.spriteRect.height,
          this.spriteRect.width,
          this.spriteRect.height,
          this.position.x,
          this.position.y,
          this.width,
          this.height
        );
      } else {
        ctx.drawImage(
          this.spriteImage,
          this.position.x,
          this.position.y,
          this.width,
          this.height
        );
      }
    } else {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

    // Draw hitbox for debugging
    if (variables.showHitboxes) {
      const hitboxBounds = this.getHitboxBounds();
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        hitboxBounds.x,
        hitboxBounds.y,
        hitboxBounds.width,
        hitboxBounds.height
      );
    }
  }

  // Get hitbox bounds in world coordinates
  getHitboxBounds() {
    return {
      x: this.position.x + this.hitbox.offsetX,
      y: this.position.y + this.hitbox.offsetY,
      width: this.hitbox.width,
      height: this.hitbox.height,
    };
  }

  update() {}
}
