import { Boss } from "../../entities/Boss.js";
import { Projectile } from "../../entities/Projectile.js";
import { Vec } from "../../../utils/Vec.js";
import { PHYSICS_CONSTANTS } from "../../../constants/gameConstants.js";

export class DragonBoss extends Boss {
    constructor(position) {
        const width = 64;
        const height = 64;
        const maxHp = 500;
        const color = "red";

        // Define attacks: Fire Ball, Fire Breath, Flame Pillar
        const attacks = [
            {
                name: "Fire Ball",
                phase: 1,
                cooldown: 15000,
                execute: (self) => {
                    console.log("DragonBoss casts Fire Ball!");
                    const room = self.currentRoom;
                    const layoutRows = room.layout.trim().split("\n");
                    const cols = layoutRows[0].length;
                    const rows = layoutRows.length;

                    // Reset Fire Ball state
                    self.fireEvents = [];
                    self.fireMarkers = [];
                    self.explosions = [];
                    self.fireTime = 0;

                    // Schedule random impact zones
                    for (let i = 0; i < self.fireCount; i++) {
                        const tx = Math.floor(1 + Math.random() * (cols - 2));
                        const ty = Math.floor(1 + Math.random() * (rows - 2));
                        const px = tx * room.tileSize;
                        const py = ty * room.tileSize;
                        const delay = Math.random() * self.fireDuration;
                        self.fireEvents.push({ position: new Vec(px, py), delay, spawned: false });
                    }
                }
            },
            {
                name: "Fire Breath",
                phase: 2,
                cooldown: 15000,
                execute: (self) => {
                    console.log("DragonBoss uses Fire Breath!");
                    const room = self.currentRoom;
                    const layoutRows = room.layout.trim().split("\n");
                    const cols = layoutRows[0].length;
                    const rows = layoutRows.length;

                    // Reset Fire Breath state
                    self.breathWaves = [];
                    self.breathProjectiles = [];
                    self.breathTime = 0;
                    for (let w = 0; w < self.breathWaveCount; w++) {
                        self.breathWaves.push({
                            delay: w * self.breathInterval,
                            spawned: false,
                            index: w
                        });
                    }
                },
            },
            {
                name: "Fire Walls",     // ← nombre que aparecerá en el patrón de ataques
                phase: 3,
                cooldown: 4000,
                execute: (self) => {
                    console.log("DragonBoss uses Fire Walls!");
                    const room = self.currentRoom;
                    const layoutRows = room.layout.trim().split("\n");
                    const cols = layoutRows[0].length;
                    const rows = layoutRows.length;

                    // Reiniciamos estado de “Fire Walls”
                    self.wallWaves = [];
                    self.wallProjectiles = [];
                    self.wallTime = 0;

                    // Calculamos qué “filas centrales” queremos cubrir (centro ± halfCenter)
                    const midRow = Math.floor(rows / 2);
                    const halfCenter = Math.floor(self.wallCenterHeight / 2);
                    const startCenterRow = midRow - halfCenter;
                    const endCenterRow = midRow + halfCenter;

                    // Elegimos un gapStart aleatorio inicial
                    let prevGap = Math.floor(Math.random() * (cols - self.wallGapSize - 2)) + 1;

                    // Creamos N sub-olas “center”, una por cada fila entre startCenterRow..endCenterRow
                    // Cada sub-ola tendrá un delay base (w * wallInterval) + offset según su fila,
                    // para escalonar la aparición y simular espaciado vertical.
                    for (let w = 0; w < self.wallWaveCount; w++) {
                        // Gap para la ola w
                        const offsetGap = Math.floor(Math.random() * 3) - 1;
                        let gapStart = Math.min(
                            Math.max(prevGap + offsetGap, 1),
                            cols - self.wallGapSize - 1
                        );
                        prevGap = gapStart;

                        // Para cada fila “row” (filas centrales virtuales)
                        for (let row = startCenterRow; row <= endCenterRow; row++) {
                            if (row < 1 || row > rows - 2) continue;

                            // Calculamos un retraso adicional para que cada línea nazca escalonada:
                            // cuando la línea row haya de aparecer X tiles más abajo, esperamos X * (tileSize/velocidad).
                            const verticalOffsetMs =
                                (row - startCenterRow) * ((room.tileSize / self.wallProjectileSpeed) * 1000);

                            // Guardamos la sub-ola en wallWaves
                            self.wallWaves.push({
                                // Delay total = delay base de la ola + offset vertical
                                delay: w * self.wallInterval + verticalOffsetMs,
                                gapStart,
                                row,
                                spawned: false,
                                isLast: row === endCenterRow  // marcamos si es la última línea de esta ola
                            });
                        }
                    }
                }
            },
        ];

        super(position, width, height, color, maxHp, attacks, "dragon boss");

        // === Fire Ball configuration ===
        this.fireDuration = 4000;      // ms window
        this.fireCount = 15;
        this.fireEvents = [];
        this.fireMarkers = [];
        this.explosions = [];
        this.fireTime = 0;
        this.markerTime = 1000;
        this.damage = 200;
        this.markerRadius = 1.5;      // multiplier for tileSize

        // === Fire Breath configuration ===
        this.breathWaveCount = 6;
        this.breathInterval = 800;
        this.breathGapSize = 2;
        this.breathDamage = 300;
        this.breathProjectileSpeed = 250;
        this.breathGapSize = 2;
        this.breathProjectileCount = 30;
        this.breathWaves = [];
        this.breathProjectiles = [];
        this.breathTime = 0;

        // === Fire Pillar configuration ===
        this.wallWaveCount = 6;
        this.wallInterval = 500;
        this.wallDamage = 200;
        this.wallProjectileSpeed = 200;
        this.wallProjectiles = [];
        this.wallWaves = [];
        this.wallTime = 0;
        this.wallGapSize = 4;
        this.wallSideWidth = 2;
        this.wallCenterHeight = 3;
    }

    update(deltaTime) {
        super.update(deltaTime);
        const room = this.currentRoom;
        const layoutRows = room.layout.trim().split("\n");
        const cols = layoutRows[0].length;
        const rows = layoutRows.length;

        // Fire Ball update
        this.fireTime += deltaTime;
        for (let evt of this.fireEvents) {
            if (!evt.spawned && this.fireTime >= evt.delay) {
                this.fireMarkers.push({ position: new Vec(evt.position.x, evt.position.y), timer: this.markerTime });
                evt.spawned = true;
            }
        }
        for (let i = this.fireMarkers.length - 1; i >= 0; i--) {
            const m = this.fireMarkers[i];
            m.timer -= deltaTime;
            if (m.timer <= 0) {
                const player = window.game.player;
                const cx = m.position.x + room.tileSize / 2;
                const cy = m.position.y + room.tileSize / 2;
                const r = room.tileSize * this.markerRadius;
                const dx = (player.position.x + player.width / 2) - cx;
                const dy = (player.position.y + player.height / 2) - cy;
                const playerHalf = player.width / 2;
                const hitRadius = r + playerHalf;
                if (dx * dx + dy * dy <= hitRadius * hitRadius)
                    player.takeDamage(this.damage);
                this.explosions.push({ position: new Vec(m.position.x, m.position.y), timer: 300, maxRadius: room.tileSize });
                this.fireMarkers.splice(i, 1);
            }
        }
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const e = this.explosions[i];
            e.timer -= deltaTime;
            if (e.timer <= 0) this.explosions.splice(i, 1);
        }

        // Fire Breath
        this.breathTime += deltaTime;
        const projectileRadius = PHYSICS_CONSTANTS.PROJECTILE_RADIUS;
        for (let wave of this.breathWaves) {
            if (!wave.spawned && this.breathTime >= wave.delay) {
                const centerX = this.position.x + this.width / 2;
                const centerY = this.position.y + this.height / 2;
                const center = new Vec(centerX, centerY);

                const roomWidth = cols * room.tileSize;
                const roomHeight = rows * room.tileSize;
                const maxDistance = Math.hypot(roomWidth, roomHeight);

                const baseOffset = (Math.PI / this.breathProjectileCount) * wave.index;

                for (let i = 0; i < this.breathProjectileCount; i++) {
                    const angle = baseOffset + (Math.PI * 2 / this.breathProjectileCount) * i;
                    const dirX = Math.cos(angle);
                    const dirY = Math.sin(angle);

                    // Inicia justo fuera del sprite del dragón:
                    const startX = center.x + dirX * (this.width / 2 + 8 + 2);
                    const startY = center.y + dirY * (this.height / 2 + 8 + 2);
                    const start = new Vec(startX, startY);

                    // End: un punto muy lejano en la misma dirección
                    const endX = center.x + dirX * maxDistance;
                    const endY = center.y + dirY * maxDistance;
                    const end = new Vec(endX, endY);

                    const proj = new Projectile(start, end, this.breathProjectileSpeed, this.breathDamage);
                    proj.setCurrentRoom(room);
                    proj.color = "white";
                    this.breathProjectiles.push(proj);
                }
                wave.spawned = true;
            }
        }
        for (let i = this.breathProjectiles.length - 1; i >= 0; i--) {
            const p = this.breathProjectiles[i];
            p.update(deltaTime, window.game.player);
            if (!p.isActive) this.breathProjectiles.splice(i, 1);
        }

        // Fire Walls
        this.wallTime += deltaTime;

        // Para que los proyectiles crucen toda la sala:
        const roomWidth = cols * room.tileSize;
        const roomHeight = rows * room.tileSize;
        const maxDistance = Math.hypot(roomWidth, roomHeight);

        // Fila central (puede ajustar si fila 0 y rows−1 son muros)
        const midRow = Math.floor(rows / 2);
        const halfCenter = Math.floor(this.wallCenterHeight / 2);
        const startCenterRow = midRow - halfCenter;
        const endCenterRow = midRow + halfCenter;

        for (let wv of this.wallWaves) {
            if (!wv.spawned && this.wallTime >= wv.delay) {
                // 1) Primero: generamos la “línea central” para wv.row
                for (let col = 1; col < cols - 1; col++) {
                    // Si col está dentro del hueco [gapStart … gapStart+wallGapSize-1], lo saltamos
                    if (col >= wv.gapStart && col < wv.gapStart + this.wallGapSize) {
                        continue;
                    }
                    const x = col * room.tileSize + room.tileSize / 2;
                    // El spawn siempre se hace en “fila 1” (justo debajo del techo):
                    const y = room.tileSize + room.tileSize / 2;
                    const start = new Vec(x, y);
                    const end = new Vec(x, y + maxDistance);

                    const proj = new Projectile(
                        start,
                        end,
                        this.wallProjectileSpeed,
                        this.wallDamage
                    );
                    proj.setCurrentRoom(room);
                    proj.color = "orange";
                    this.wallProjectiles.push(proj);
                }

                // 2) Si NO es la última sub-ola, generamos también proyectiles en los costados
                if (!wv.isLast) {
                    for (let col = 0; col < this.wallSideWidth; col++) {
                        // LADO IZQUIERDO
                        {
                            const x = col * room.tileSize + room.tileSize / 2;
                            const y = room.tileSize + room.tileSize / 2; // fila 1
                            const start = new Vec(x, y);
                            const end = new Vec(x, y + maxDistance);
                            const proj = new Projectile(
                                start,
                                end,
                                this.wallProjectileSpeed,
                                this.wallDamage
                            );
                            proj.setCurrentRoom(room);
                            proj.color = "orange";
                            this.wallProjectiles.push(proj);
                        }
                        // LADO DERECHO
                        {
                            const x = (cols - 1 - col) * room.tileSize + room.tileSize / 2;
                            const y = room.tileSize + room.tileSize / 2; // fila 1
                            const start = new Vec(x, y);
                            const end = new Vec(x, y + maxDistance);
                            const proj = new Projectile(
                                start,
                                end,
                                this.wallProjectileSpeed,
                                this.wallDamage
                            );
                            proj.setCurrentRoom(room);
                            proj.color = "orange";
                            this.wallProjectiles.push(proj);
                        }
                    }
                }

                wv.spawned = true;
            }
        }

        // Actualizamos y purgamos proyectiles inactivos
        for (let i = this.wallProjectiles.length - 1; i >= 0; i--) {
            const p = this.wallProjectiles[i];
            p.update(deltaTime, window.game.player);
            if (!p.isActive) this.wallProjectiles.splice(i, 1);
        }
    }

    draw(ctx) {
        const room = this.currentRoom;

        // Draw Fire Ball zones
        ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
        this.fireMarkers.forEach(m => {
            const cx = m.position.x + room.tileSize / 2;
            const cy = m.position.y + room.tileSize / 2;
            const r = room.tileSize * this.markerRadius;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
        });
        // Draw explosion animations
        ctx.strokeStyle = "orange";
        this.explosions.forEach(e => {
            const progress = 1 - (e.timer / 300);
            const r = e.maxRadius * progress;
            const cx = e.position.x + room.tileSize / 2;
            const cy = e.position.y + room.tileSize / 2;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.lineWidth = 4;
            ctx.stroke();
        });

        // Draw Fire Breath projectiles
        this.breathProjectiles.forEach(p => p.draw(ctx));

        // Draw Fire Walls projectiles
        this.wallProjectiles.forEach((p) => p.draw(ctx));

        // Draw boss
        super.draw(ctx);
    }
}
