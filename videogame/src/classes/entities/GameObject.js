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
      // For immediate dimension calculation, use known sprite dimensions
      // This prevents rendering issues during sprite transitions
      let frameWidth, frameHeight;

      // Calculate expected frame dimensions based on known sprite sheet layouts
      if (imagePath.includes("katana")) {
        if (imagePath.includes("slash.png")) {
          frameWidth = 128; // 768px / 6 cols = 128px
          frameHeight = 128; // 512px / 4 rows = 128px
        } else {
          frameWidth = 128; // 1152px / 9 cols = 128px
          frameHeight = 128; // 512px / 4 rows = 128px
        }
      } else if (imagePath.includes("bow")) {
        if (imagePath.includes("shoot.png")) {
          frameWidth = 64; // 832px / 13 cols = 64px
          frameHeight = 64; // 256px / 4 rows = 64px
        } else {
          frameWidth = 128; // 1152px / 9 cols = 128px
          frameHeight = 128; // 512px / 4 rows = 128px
        }
      } else if (imagePath.includes("crossbow")) {
        if (imagePath.includes("shoot.png")) {
          frameWidth = 64; // 512px / 8 cols = 64px
          frameHeight = 64; // 256px / 4 rows = 64px
        } else {
          frameWidth = 64; // 576px / 9 cols = 64px
          frameHeight = 64; // 256px / 4 rows = 64px
        }
      } else if (imagePath.includes("slingshot")) {
        if (imagePath.includes("shoot.png")) {
          frameWidth = 64; // 832px / 13 cols = 64px
          frameHeight = 64; // 256px / 4 rows = 64px
        } else {
          frameWidth = 64; // 576px / 9 cols = 64px
          frameHeight = 64; // 256px / 4 rows = 64px
        }
      } else if (
        imagePath.includes("dagger") ||
        imagePath.includes("lightsaber")
      ) {
        frameWidth = 64; // All dagger/lightsaber sprites use 64x64 frames
        frameHeight = 64;
      } else {
        // Default fallback - will be corrected by onload
        frameWidth = 64;
        frameHeight = 64;
      }

      // Set immediate dimensions to prevent rendering glitches
      this.spriteRect = new Rect(0, 0, frameWidth, frameHeight);

      // Debug logging removed to reduce console spam

      // For AnimatedObjects, verify and correct dimensions when image loads
      this.spriteImage.onload = () => {
        // Calculate actual frame dimensions from loaded image
        const actualFrameWidth = this.spriteImage.width / this.sheetCols;
        const actualFrameHeight = this.spriteImage.height / 4; // Always 4 rows for player sprites

        // Update dimensions if they differ from our immediate calculations
        if (
          Math.abs(actualFrameWidth - this.spriteRect.width) > 1 ||
          Math.abs(actualFrameHeight - this.spriteRect.height) > 1
        ) {
          this.spriteRect.width = actualFrameWidth;
          this.spriteRect.height = actualFrameHeight;

          // Debug logging removed to reduce console spam
        } else {
          // Debug logging removed to reduce console spam
        }

        // For debugging: Check if this is an attack sprite change
        if (
          imagePath.includes("slash.png") ||
          imagePath.includes("shoot.png")
        ) {
          // Debug logging removed to reduce console spam
        }
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
