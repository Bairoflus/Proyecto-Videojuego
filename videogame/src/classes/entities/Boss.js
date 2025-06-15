import { Enemy } from "./Enemy.js";
import { AnimatedObject } from "./AnimatedObject.js";
import { variables } from "../../config.js";

export class Boss extends Enemy {
  constructor(position, width, height, color, maxHp, attacks = [], enemyTypeName = "dragon") {
    super(position, width, height, color, 1, "boss", 0, 0, maxHp, enemyTypeName);
    this.attacks = attacks;
    this.phase = 1;
    this.nextAttackTime = 0;
    this.fightStartTime = Date.now(); // Track fight duration for boss kill registration

    // CRITICAL FIX: Add isBoss property for proper boss detection in Room.js
    this.isBoss = true;

    // Retraso inicial antes del primer ataque (para todos los jefes)
    this.initialDelay = true;
    this.initialDelayTime = 3000; // 3 segundos de espera
  }

  updatePhase() {
    const ratio = this.health / this.maxHealth;
    if (ratio <= 0.33) this.phase = 3;
    else if (ratio <= 0.66) this.phase = 2;
    else this.phase = 1;
  }

  getAttackForCurrentPhase() {
    const available = this.attacks.filter((a) => a.phase <= this.phase);
    return available.length
      ? available[Math.floor(Math.random() * available.length)]
      : null;
  }

  update(deltaTime) {
    super.update(deltaTime);
    this.updatePhase();

    // Manejar el retraso inicial
    if (this.initialDelay) {
      this.initialDelayTime -= deltaTime;
      if (this.initialDelayTime <= 0) {
        this.initialDelay = false;
      }
      return; // No ejecutar ataques durante el retraso inicial
    }

    if (Date.now() > this.nextAttackTime) {
      const attack = this.getAttackForCurrentPhase();
      if (attack) {
        attack.execute(this); // Execute the attack logic
        this.nextAttackTime = Date.now() + attack.cooldown;
      }
    }
  }

  /**
   * SIMPLIFIED: Override die method - let Enemy.js handle most logic
   */
  die() {
    // Let parent Enemy class handle the standard death logic
    super.die();

    // Only add boss-specific behavior here
    console.log(`Boss ${this.type} defeated!`);

    // Calculate fight duration for metrics
    const fightDuration = Math.round((Date.now() - this.fightStartTime) / 1000);
    console.log(`Boss fight duration: ${fightDuration} seconds`);
  }

  draw(ctx) {
    AnimatedObject.prototype.draw.call(this, ctx);
  }

  drawUI(ctx) {
    if (!this.currentRoom || this.health <= 0) return;

    const barWidth = 300;
    const barHeight = 12;
    const x = (variables.canvasWidth - barWidth) / 2;
    const y = variables.canvasHeight - barHeight - 20; // 20px de margen inferior

    const pct = this.health / this.maxHealth;

    // Fondo semitransparente (rojo oscuro)
    ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
    ctx.fillRect(x, y, barWidth, barHeight);

    // Vida actual (verde)
    ctx.fillStyle = "rgba(0, 255, 0, 0.8)";
    ctx.fillRect(x, y, barWidth * pct, barHeight);

    // Borde blanco
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);

    // Texto: nombre del boss (dinámico, en mayúsculas)
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(this.displayName.toUpperCase(), x + barWidth / 2, y - 6);

    // Texto: HP actual/máximo
    const currentHP = Math.round(this.health);
    const maxHP = Math.round(this.maxHealth);
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `HP ${currentHP}/${maxHP}`,
      x + barWidth / 2,
      y + barHeight / 2
    );
  }
}
