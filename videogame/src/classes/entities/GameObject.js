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
    
    // Set the provided rect or calculate it automatically for AnimatedObjects
    if (rect) {
      this.spriteRect = rect;
    } else if (this.sheetCols) {
      // Initialize with default dimensions immediately to prevent null reference errors
      // These will be updated with correct dimensions when the image loads
      this.spriteRect = new Rect(0, 0, 64, 64); // Temporary default dimensions
      
      // For AnimatedObjects, calculate actual frame dimensions when image loads
      this.spriteImage.onload = () => {
        // Calculate frame dimensions: spritesheet dimensions / actual columns and rows
        // All player spritesheets have 4 rows (up, left, down, right directions)
        const frameWidth = this.spriteImage.width / this.sheetCols;
        const frameHeight = this.spriteImage.height / 4; // Always 4 rows for player sprites
        
        // Update the existing spriteRect with correct dimensions
        this.spriteRect.width = frameWidth;
        this.spriteRect.height = frameHeight;
        
        console.log(`Auto-calculated sprite dimensions: ${frameWidth}x${frameHeight} (cols: ${this.sheetCols}, rows: 4) for ${imagePath}`);
      };
    }
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
