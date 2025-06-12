import { Enemy } from "./Enemy.js";
import { AnimatedObject } from "./AnimatedObject.js";

export class Boss extends Enemy {
  constructor(position, width, height, color, maxHp, attacks = []) {
    super(position, width, height, color, 1, "boss", 0, 0, maxHp);
    this.attacks = attacks;
    this.phase = 1;
    this.nextAttackTime = 0;
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

    if (Date.now() > this.nextAttackTime) {
      const attack = this.getAttackForCurrentPhase();
      if (attack) {
        attack.execute(this); // Execute the attack logic
        this.nextAttackTime = Date.now() + attack.cooldown;
      }
    }
  }
  draw(ctx) {
    AnimatedObject.prototype.draw.call(this, ctx);
  }
}
