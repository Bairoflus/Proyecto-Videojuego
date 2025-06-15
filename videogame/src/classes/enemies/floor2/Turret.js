// Turret.js
import { Enemy } from "../../entities/Enemy.js";
import { Projectile } from "../../entities/Projectile.js";
import { Vec } from "../../../utils/Vec.js";
import { variables } from "../../../config.js";

export class Turret extends Enemy {
    constructor(position) {
        const width = 32;
        const height = 32;
        const color = "#8B0000"; // dark red color for turret
        const maxHp = 100;
        super(position, width, height, color, 0, "turret", 0, 0, maxHp, "turret");
        this.displayName = "Turret";
        this.projectiles = [];

        // Burst parameters
        this.burstTimer = 0;
        this.burstDelay = 4000; // seconds between bursts
        this.shotTimer = 0;
        this.shotInterval = 300; // seconds between each shot in burst
        this.shotsPerBurst = 5; // shots per burst
        this.shotsFired = 0;
        this.bursting = false;
    }

    getHitboxBounds() {
        return {
            x: this.position.x,
            y: this.position.y,
            width: this.width,
            height: this.height,
        };
    }

    // Override moveTo to keep turret static
    moveTo() { }

    update(dt, player, room) {
        if (this.health <= 0) {
            // We no longer apply damage here, the boss will detect the destroyed turret
            // and apply damage in its own update method
            return;
        }

        // Burst management
        this.burstTimer += dt;
        if (!this.bursting && this.burstTimer >= this.burstDelay) {
            this.bursting = true;
            this.burstTimer = 0;
            this.shotTimer = 0;
            this.shotsFired = 0;
        }

        if (this.bursting) {
            this.shotTimer += dt;
            if (
                this.shotTimer >= this.shotInterval &&
                this.shotsFired < this.shotsPerBurst
            ) {
                this._fireAt(player.position, room);
                this.shotTimer = 0;
                this.shotsFired += 1;
                // If burst completed, close it
                if (this.shotsFired >= this.shotsPerBurst) {
                    this.bursting = false;
                }
            }
        }

        // Update turret projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(dt);
            if (!p.isActive) this.projectiles.splice(i, 1);
        }

        super.update(dt, player, room);
    }

    _fireAt(target, room) {
        const dx = target.x - this.position.x;
        const dy = target.y - this.position.y;
        const angle = Math.atan2(dy, dx);

        const start = new Vec(
            this.position.x + this.width / 2,
            this.position.y + this.height / 2
        );

        // Create a target point in the angle direction
        const targetPoint = new Vec(
            start.x + Math.cos(angle) * 1000,
            start.y + Math.sin(angle) * 1000
        );

        // Projectile speed and damage
        const speed = 75;
        const damage = 20;

        // Create a projectile with a start point and target
        const proj = new Projectile(
            start,
            targetPoint,
            speed,
            damage,
            4 // Smaller radius for projectiles
        );

        proj.color = "#ff4444";
        proj.setCurrentRoom(room);

        this.projectiles.push(proj);
    }

    draw(ctx) {
        super.draw(ctx);
        // Draw projectiles
        this.projectiles.forEach((p) => p.draw(ctx));
        // Removed debug text that showed name and health
    }

    drawUI(ctx) {
        super.drawUI(ctx);
    }
}