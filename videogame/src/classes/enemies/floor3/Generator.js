// Generator.js
import { Enemy } from "../../entities/Enemy.js";
import { Vec } from "../../../utils/Vec.js";

export class Generator extends Enemy {
  constructor(position) {
    const width = 32;
    const height = 32;
    const color = "#555555"; // dark gray color for generator
    const maxHp = 150;
    super(position, width, height, color, 0, "generator", 0, 0, maxHp, "generator");
    this.displayName = "Shield Generator";
    this.pulseTime = 0;
    this.pulseScale = 1;
    this.parent = null; // Reference to parent boss
  }

  getHitboxBounds() {
    return {
      x: this.position.x,
      y: this.position.y,
      width: this.width,
      height: this.height,
    };
  }

  // Override moveTo to keep generator static
  moveTo() { }

  update(dt, player, room) {
    if (this.health <= 0) {
      // Notify parent boss when destroyed
      if (this.parent) {
        console.log("Generator destroyed, notifying parent boss");
      }
      return;
    }

    // Pulse animation
    this.pulseTime += dt;
    this.pulseScale = 1 + 0.2 * Math.sin(this.pulseTime / 200);

    super.update(dt, player, room);
  }

  draw(ctx) {
    if (this.health <= 0) return;

    ctx.save();
    ctx.translate(
      this.position.x + this.width / 2,
      this.position.y + this.height / 2
    );
    ctx.scale(this.pulseScale, this.pulseScale);

    // Main body
    ctx.fillStyle = this.color;
    ctx.fillRect(
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );

    // Energy core
    ctx.fillStyle = "#00ffff";
    ctx.beginPath();
    ctx.arc(0, 0, this.width / 4, 0, Math.PI * 2);
    ctx.fill();

    // Energy field
    ctx.beginPath();
    ctx.arc(0, 0, this.width / 3, 0, Math.PI * 2);
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  drawUI(ctx) {
    super.drawUI(ctx);
  }
}