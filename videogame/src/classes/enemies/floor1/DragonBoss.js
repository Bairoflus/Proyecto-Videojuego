import { Boss } from "../../entities/Boss.js";
import { Vec } from "../../../utils/Vec.js";

export class DragonBoss extends Boss {
    constructor(position) {
        const width = 64;
        const height = 64;
        const maxHp = 500;
        const color = "red";

        // Define attacks: Fire Ball first
        const attacks = [
            {
                name: "Fire Ball",
                phase: 1,
                cooldown: 10000,
                execute: (self) => {
                    console.log("DragonBoss casts Fire Ball!");
                    const room = self.currentRoom;
                    const layoutRows = room.layout.trim().split('\n');
                    const cols = layoutRows[0].length;
                    const rows = layoutRows.length;

                    // Reset previous state
                    self.fireEvents = [];
                    self.fireMarkers = [];
                    self.explosions = [];
                    self.fireTime = 0;

                    // Schedule random ground zones
                    for (let i = 0; i < self.fireCount; i++) {
                        const tileX = Math.floor(1 + Math.random() * (cols - 2));
                        const tileY = Math.floor(1 + Math.random() * (rows - 2));
                        const posX = tileX * room.tileSize;
                        const posY = tileY * room.tileSize;
                        const spawnDelay = Math.random() * self.fireDuration;
                        self.fireEvents.push({ position: new Vec(posX, posY), delay: spawnDelay, spawned: false });
                    }
                }
            },
            {
                name: "Fire Breath",
                phase: 2,
                cooldown: 3000,
                execute: (self) => {
                    console.log("DragonBoss uses Fire Breath!");
                }
            },
            {
                name: "Flame Pillar",
                phase: 3,
                cooldown: 5000,
                execute: (self) => {
                    console.log("DragonBoss summons Flame Pillar!");
                }
            }
        ];

        super(position, width, height, color, maxHp, attacks);

        // Fire Ball configuration
        this.fireDuration = 5000;    // total window (ms)
        this.fireCount = 15;         // number of zones
        this.fireEvents = [];
        this.fireMarkers = [];       // { position: Vec, timer }
        this.explosions = [];        // for explosion animation
        this.fireTime = 0;
        this.markerTime = 1500;      // ms before impact
        this.damage = 200;
        this.markerRadius = 1.0;    // multiplier for zone radius
    }

    update(deltaTime) {
        super.update(deltaTime);
        const room = this.currentRoom;
        this.fireTime += deltaTime;

        // Spawn markers when delay elapses
        for (let evt of this.fireEvents) {
            if (!evt.spawned && this.fireTime >= evt.delay) {
                this.fireMarkers.push({ position: new Vec(evt.position.x, evt.position.y), timer: this.markerTime });
                evt.spawned = true;
            }
        }

        // Process markers countdown and impact
        for (let i = this.fireMarkers.length - 1; i >= 0; i--) {
            const m = this.fireMarkers[i];
            m.timer -= deltaTime;
            if (m.timer <= 0) {
                const player = window.game.player;
                const cx = m.position.x + room.tileSize / 2;
                const cy = m.position.y + room.tileSize / 2;
                const radius = room.tileSize * 0.75;
                const dx = (player.position.x + player.width / 2) - cx;
                const dy = (player.position.y + player.height / 2) - cy;
                if (dx * dx + dy * dy <= radius * radius) {
                    player.takeDamage(this.damage);
                }
                this.explosions.push({ position: new Vec(m.position.x, m.position.y), timer: 300, maxRadius: room.tileSize });
                this.fireMarkers.splice(i, 1);
            }
        }

        // Update explosion animations
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const exp = this.explosions[i];
            exp.timer -= deltaTime;
            if (exp.timer <= 0) this.explosions.splice(i, 1);
        }
    }

    draw(ctx) {
        const room = this.currentRoom;

        // Draw ground zones
        ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
        this.fireMarkers.forEach(m => {
            const cx = m.position.x + room.tileSize / 2;
            const cy = m.position.y + room.tileSize / 2;
            const r = room.tileSize * this.markerRadius;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw explosion animation
        ctx.strokeStyle = "orange";
        this.explosions.forEach(exp => {
            const progress = 1 - (exp.timer / 300);
            const r = exp.maxRadius * progress;
            const cx = exp.position.x + room.tileSize / 2;
            const cy = exp.position.y + room.tileSize / 2;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.lineWidth = 4;
            ctx.stroke();
        });

        // Draw boss and health bar
        super.draw(ctx);
    }
}