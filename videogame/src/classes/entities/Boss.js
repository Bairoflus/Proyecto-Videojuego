import { Enemy } from "./Enemy.js";
import { AnimatedObject } from "./AnimatedObject.js";
import { registerBossKill } from "../../utils/api.js";

export class Boss extends Enemy {
    constructor(position, width, height, color, maxHp, attacks = [], enemyTypeName = "dragon") {
        super(position, width, height, color, 1, "boss", 0, 0, maxHp, enemyTypeName);
        this.attacks = attacks;
        this.phase = 1;
        this.nextAttackTime = 0;
        this.fightStartTime = Date.now(); // Track fight duration for boss kill registration
    }

    updatePhase() {
        const ratio = this.health / this.maxHealth;
        if (ratio <= 0.33) this.phase = 3;
        else if (ratio <= 0.66) this.phase = 2;
        else this.phase = 1;
    }

    getAttackForCurrentPhase() {
        const available = this.attacks.filter(a => a.phase <= this.phase);
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

    /**
     * SIMPLIFIED: Override die method - let Enemy.js handle most logic
     */
    die() {
        // Let parent Enemy class handle the standard death logic
        super.die();
        
        // Only add boss-specific behavior here
        console.log(`🏆 Boss ${this.type} defeated!`);
        
        // Calculate fight duration for metrics
        const fightDuration = Math.round((Date.now() - this.fightStartTime) / 1000);
        console.log(`🕐 Boss fight duration: ${fightDuration} seconds`);
    }

    draw(ctx) {
        AnimatedObject.prototype.draw.call(this, ctx);
    }
}
