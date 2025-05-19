// Player.js: Jugador controlable con física y animación
import { AnimatedObject } from "./AnimatedObject.js";
import { Vec } from "./Vec.js";
import { variables, playerMovement } from "../config.js";

export class Player extends AnimatedObject {
  constructor(position, width, height, color, sheetCols) {
    super(position, width, height, color, "player", sheetCols);
    this.velocity = new Vec(0, 0);
    this.keys = [];
    this.previousDirection = "down";
    this.currentDirection = "down";
    // ——— DASH PROPERTIES ———
    this.dashDuration = 100;                    // ms que dura el dash
    this.dashSpeed = variables.playerSpeed * 3; // velocidad durante dash
    this.dashTime = 0;                          // tiempo restante de dash
    this.dashCooldown = 1000;                   // ms de cooldown entre dashes
    this.dashCooldownTime = 0;                  // timer de cooldown
    this.dashDirection = new Vec(0, 0);         // dirección fijada al dash
  }
  update(deltaTime) {
    // Reducir cooldown y tiempo de dash
    if (this.dashCooldownTime > 0) this.dashCooldownTime -= deltaTime;

    if (this.dashTime > 0) {
      // Durante dash: mover en dashDirection
      this.position = this.position.plus(
        this.dashDirection.times(
          this.dashSpeed * deltaTime
        )
      );
      this.dashTime -= deltaTime;
    }
    else {
      // Movimiento normal
      this.setVelocity();
      this.position = this.position.plus(
        this.velocity.times(deltaTime)
      );
    }

    this.constrainToCanvas();
    this.setMovementAnimation();
    this.updateFrame(deltaTime);
  }

  // startDash: inicia el dash si no está en cooldown
  startDash() {
    if (this.dashCooldownTime <= 0 && this.dashTime <= 0) {
      this.dashTime = this.dashDuration;
      this.dashCooldownTime = this.dashCooldown;
      this.dashDirection = this.velocity.normalize();
    }
  }

  // Evita salida del canvas
  constrainToCanvas() {
    const w = variables.canvasWidth;
    const h = variables.canvasHeight;
    if (this.position.y < 0) this.position.y = 0;
    else if (this.position.y + this.height > h) this.position.y = h - this.height;
    if (this.position.x < 0) this.position.x = 0;
    else if (this.position.x + this.width > w) this.position.x = w - this.width;
  }
  // Calcula velocidad normalizada según teclas presionadas
  setVelocity() {
    this.velocity = new Vec(0, 0);
    for (const key of this.keys) {
      const move = playerMovement[key];
      this.velocity[move.axis] += move.direction;
    }
    this.velocity = this.velocity.normalize().times(variables.playerSpeed);
  }
  // Determina dirección y ajusta animación
  setMovementAnimation() {
    const v = this.velocity;
    this.currentDirection =
      Math.abs(v.y) > Math.abs(v.x)
        ? v.y > 0 ? "down" : v.y < 0 ? "up" : "idle"
        : v.x > 0 ? "right" : v.x < 0 ? "left" : "idle";
    if (this.currentDirection !== this.previousDirection) {
      const anim = playerMovement[this.currentDirection];
      this.setAnimation(...anim.frames, anim.repeat, anim.duration);
      this.frame = this.minFrame;
    }
    this.previousDirection = this.currentDirection;
  }
}