// Drone.js
import { Enemy } from "../../entities/Enemy.js";
import { Projectile } from "../../entities/Projectile.js";
import { Vec } from "../../../utils/Vec.js";
import { variables } from "../../../config.js";

export class Drone extends Enemy {
    constructor(position) {
        const width = 32;
        const height = 32;
        const color = "#ffcc00";  // dorado para destacar
        const maxHp = 100;
        super(position, width, height, color,
            0,
            "drone",
            0,
            0,
            maxHp,
            "drone"
        );
        this.displayName = "Drone";
        this.projectiles = [];

        // Parámetros de ráfaga
        this.burstTimer = 0;
        this.burstDelay = 4000;    // segundos entre ráfagas
        this.shotTimer = 0;
        this.shotInterval = 300;  // segundos entre cada disparo en la ráfaga
        this.shotsPerBurst = 5;    // disparos por ráfaga
        this.shotsFired = 0;
        this.bursting = false;
    }

    // Anula moveTo para mantener el dron estático
    moveTo() { }

    update(dt, player, room) {
        if (this.health <= 0) {
            // Ya no aplicamos daño aquí, el jefe detectará el dron destruido
            // y aplicará el daño en su propio método update
            return;
        }

        // Gestión de ráfagas
        this.burstTimer += dt;
        if (!this.bursting && this.burstTimer >= this.burstDelay) {
            this.bursting = true;
            this.burstTimer = 0;
            this.shotTimer = 0;
            this.shotsFired = 0;
        }

        if (this.bursting) {
            this.shotTimer += dt;
            if (this.shotTimer >= this.shotInterval && this.shotsFired < this.shotsPerBurst) {
                this._fireAt(player.position, room);
                this.shotTimer = 0;
                this.shotsFired += 1;
                // Si completó la ráfaga, cerrarla
                if (this.shotsFired >= this.shotsPerBurst) {
                    this.bursting = false;
                }
            }
        }

        // Actualiza proyectiles del dron
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

        // Crear un punto objetivo en la dirección del ángulo
        const targetPoint = new Vec(
            start.x + Math.cos(angle) * 1000,
            start.y + Math.sin(angle) * 1000
        );

        // Velocidad y daño del proyectil
        const speed = 75;
        const damage = 20;

        // Crear un proyectil con un punto de inicio y un objetivo
        const proj = new Projectile(
            start,
            targetPoint,
            speed,
            damage,
            4  // Radio más pequeño para proyectiles
        );

        proj.color = "#ff4444";
        proj.setCurrentRoom(room);

        this.projectiles.push(proj);
    }

    draw(ctx) {
        super.draw(ctx);
        // Dibuja proyectiles
        this.projectiles.forEach(p => p.draw(ctx));
        // Se eliminó el texto de depuración que mostraba el nombre y la vida
    }

    drawUI(ctx) {
        super.drawUI(ctx);
    }
}
