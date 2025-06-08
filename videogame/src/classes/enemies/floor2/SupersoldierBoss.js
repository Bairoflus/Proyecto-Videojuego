import { Boss } from "../../entities/Boss.js";
import { Vec } from "../../../utils/Vec.js";
import { variables } from "../../../config.js";
import { Drone } from "./Drone.js";

export class Supersoldier extends Boss {
    constructor(position) {
        const width = 64;
        const height = 64;
        const maxHp = 1000;
        const color = "#2a75f3"; // azul metálico

        // Definimos ataques por fase: fase 1 = drones, fase 2 = escudo, fase 3 = ataque cargado
        const attacks = [
            {
                name: "Drone Summon",
                phase: 1,
                cooldown: 12000, // 12s entre invocaciones
                execute: (self) => {
                    // No invocar drones durante el periodo de espera inicial
                    if (self.initialDelay) {
                        return;
                    }
                    
                    // Solo invocar si no hemos alcanzado el límite de drones
                    if (self.drones.length < self.maxDrones) {
                        // Calcular posición para el nuevo dron (alrededor del jefe)
                        const angle = Math.random() * Math.PI * 2; // Ángulo aleatorio
                        const distance = 100; // Distancia desde el jefe
                        const spawnPos = new Vec(
                            self.position.x + Math.cos(angle) * distance,
                            self.position.y + Math.sin(angle) * distance
                        );

                        // Implementación limpia y directa
                        const drone = new Drone(spawnPos);
                        drone.setCurrentRoom(self.currentRoom);   // para que room.update() lo reciba bien
                        drone.parent = self;                      // para daño al jefe
                        self.currentRoom.objects.enemies.push(drone);
                        self.drones.push(drone);

                        console.log("Supersoldier ha invocado un dron en posición:",
                            { x: Math.round(spawnPos.x), y: Math.round(spawnPos.y) });

                        console.log("Supersoldier ha invocado un dron");
                    } else {
                        console.log("Supersoldier ya tiene el máximo de drones");
                    }
                }
            },
            {
                name: "Shield Regen",
                phase: 2,
                cooldown: 15000, // 15s entre regeneraciones
                execute: (self) => {
                    // No activar escudo durante el periodo de espera inicial
                    if (self.initialDelay) {
                        return;
                    }
                    
                    // Inicia regeneración gradual (100 puntos totales)
                    self.isRegenerating = true;
                    self.totalRegenAmount = 100;
                    self.currentRegenAmount = 0;

                    // Determina posición de la barrera según el jugador
                    const player = window.game.player;

                    // Calcular dirección basada en la posición relativa del jugador
                    const dx = player.position.x - self.position.x;
                    const dy = player.position.y - self.position.y;

                    // Determinar la dirección principal (la mayor diferencia)
                    if (Math.abs(dx) > Math.abs(dy)) {
                        self.shieldDir = dx > 0 ? "right" : "left";
                    } else {
                        self.shieldDir = dy > 0 ? "down" : "up";
                    }

                    // Ajustar la distancia de la barrera para que esté más centrada
                    self.barrierDistance = 40; // Distancia reducida para mejor centrado

                    // Quitar barrera tras duración
                    setTimeout(() => {
                        self.shieldDir = null;
                        // Asegurarse de limpiar la barrera
                        if (self.barrierWallRegistered && self.currentRoom) {
                            if (self.currentRoom.objects.temporaryWalls) {
                                self.currentRoom.objects.temporaryWalls = [];
                            }

                            if (self.currentRoom.originalCheckWallCollision) {
                                self.currentRoom.checkWallCollision = self.currentRoom.originalCheckWallCollision;
                                self.currentRoom.originalCheckWallCollision = null;
                            }

                            self.barrierWallRegistered = false;
                        }
                    }, 3000);
                }
            },
            {
                name: "Charged Shot",
                phase: 3,
                cooldown: 8000, // 8s entre disparos cargados
                execute: (self) => {
                    // No cargar disparo durante el periodo de espera inicial
                    if (self.initialDelay) {
                        return;
                    }
                    
                    // Iniciar el ataque cargado
                    self.isChargingShot = true;
                    self.chargeTime = 0;
                    self.chargeDuration = 2000; // 2 segundos de carga
                    self.warningStartTime = 1500; // Parpadeo en los últimos 500ms

                    // Apuntar al jugador
                    const player = window.game.player;
                    self.targetPosition = new Vec(
                        player.position.x + player.width / 2,
                        player.position.y + player.height / 2
                    );

                    // Calcular dirección del disparo
                    const sourcePosition = new Vec(
                        self.position.x + self.width / 2,
                        self.position.y + self.height / 2
                    );
                    const dx = self.targetPosition.x - sourcePosition.x;
                    const dy = self.targetPosition.y - sourcePosition.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    self.shotDirection = {
                        x: dx / distance,
                        y: dy / distance
                    };

                    console.log("Supersoldier está cargando un disparo potente");
                }
            }
        ];

        super(position, width, height, color, maxHp, attacks, "supersoldier");
        this.displayName = "Supersoldier";
        this.shieldDir = null;
        this.isRegenerating = false;
        this.totalRegenAmount = 0;
        this.currentRegenAmount = 0;
        this.stunned = false;
        this.stunTimeLeft = 0;
        this.barrierWallRegistered = false;
        this.barrierDistance = 40; // Distancia reducida para mejor centrado



        // Propiedades para el ataque cargado
        this.isChargingShot = false;
        this.chargeTime = 0;
        this.chargeDuration = 2000;
        this.warningStartTime = 1500;
        this.targetPosition = null;
        this.shotDirection = null;
        this.laserColor = "red";

        // Propiedades para los drones
        this.drones = [];
        this.maxDrones = 2; // Máximo 2 drones activos a la vez
    }

    drawUI(ctx) {
        // Dibuja barra y nombre
        super.drawUI(ctx);

        // Si hay barrera activa, dibújala
        if (this.shieldDir) {
            ctx.save();
            ctx.translate(
                this.position.x + this.width / 2,
                this.position.y + this.height / 2
            );
            ctx.fillStyle = "rgba(0, 200, 255, 0.5)";

            const barrierLength = this.width * 3; // Barrera más larga (aumentada para mejor simetría)
            const barrierThickness = 20; // Grosor de la barrera
            const barrierDistance = this.barrierDistance || 40; // Distancia reducida para centrar mejor

            // Dibujar barrera según la dirección
            switch (this.shieldDir) {
                case "up":
                    ctx.fillRect(-barrierLength / 2, -this.height / 2 - barrierDistance - barrierThickness, barrierLength, barrierThickness);
                    break;
                case "down":
                    ctx.fillRect(-barrierLength / 2, this.height / 2 + barrierDistance, barrierLength, barrierThickness);
                    break;
                case "left":
                    ctx.fillRect(-this.width / 2 - barrierDistance - barrierThickness, - barrierLength / 2, barrierThickness, barrierLength);
                    break;
                case "right":
                    ctx.fillRect(this.width / 2 + barrierDistance, - barrierLength / 2, barrierThickness, barrierLength);
                    break;
            }
            ctx.restore();
        }

        // Dibujar láser de apuntado si está cargando el disparo
        if (this.isChargingShot && this.targetPosition) {
            const sourceX = this.position.x + this.width / 2;
            const sourceY = this.position.y + this.height / 2;

            // Determinar el color del láser (parpadeo en los últimos 500ms)
            if (this.chargeTime >= this.warningStartTime) {
                // Parpadeo rápido entre rojo y amarillo
                const blinkRate = 100; // ms por parpadeo
                this.laserColor = Math.floor((this.chargeTime - this.warningStartTime) / blinkRate) % 2 === 0 ? "red" : "yellow";
            } else {
                this.laserColor = "red";
            }

            // Dibujar línea de láser
            ctx.beginPath();
            ctx.moveTo(sourceX, sourceY);
            ctx.lineTo(this.targetPosition.x, this.targetPosition.y);
            ctx.strokeStyle = this.laserColor;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Dibujar punto de mira en el objetivo
            ctx.beginPath();
            ctx.arc(this.targetPosition.x, this.targetPosition.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = this.laserColor;
            ctx.fill();
        }

        // Mostrar estado de aturdimiento
        if (this.stunned) {
            ctx.save();
            ctx.translate(this.position.x, this.position.y - this.height / 2 - 20);
            ctx.fillStyle = "yellow";
            ctx.font = "12px Arial";
            ctx.textAlign = "center";
            ctx.fillText("¡ATURDIDO!", 0, 0);
            ctx.restore();
        }
    }

    update(deltaTime) {
        // Si está aturdido, no hacer nada más que actualizar el tiempo de aturdimiento
        if (this.stunned) {
            this.stunTimeLeft -= deltaTime;
            if (this.stunTimeLeft <= 0) {
                this.stunned = false;
                // Interrumpir la curación cuando sale del aturdimiento
                this.isRegenerating = false;
            }
            return; // No ejecutar el resto del update mientras esté aturdido
        }

        super.update(deltaTime);

        // Actualizar ataque cargado
        if (this.isChargingShot) {
            this.chargeTime += deltaTime;

            // Actualizar la posición objetivo durante toda la carga
            if (window.game && window.game.player) { // Siempre seguir al jugador
                const player = window.game.player;
                this.targetPosition = new Vec(
                    player.position.x + player.width / 2,
                    player.position.y + player.height / 2
                );

                // Actualizar dirección del disparo
                const sourcePosition = new Vec(
                    this.position.x + this.width / 2,
                    this.position.y + this.height / 2
                );
                const dx = this.targetPosition.x - sourcePosition.x;
                const dy = this.targetPosition.y - sourcePosition.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                this.shotDirection = {
                    x: dx / distance,
                    y: dy / distance
                };
            }

            // Cuando termina la carga, disparar
            if (this.chargeTime >= this.chargeDuration) {
                this.fireChargedShot();
                this.isChargingShot = false;
            }
        }

        // Perseguir al jugador cuando no está aturdido, no tiene barrera activa y no está cargando un disparo
        if (!this.stunned && !this.shieldDir && !this.isChargingShot && window.game && window.game.player) {
            const player = window.game.player;
            const moveSpeed = 0.3; // Velocidad de movimiento

            // Calcular dirección hacia el jugador
            const dx = player.position.x - this.position.x;
            const dy = player.position.y - this.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Solo moverse si el jugador está a cierta distancia
            if (distance > 100) {
                // Normalizar y aplicar velocidad
                const moveX = dx / distance * moveSpeed;
                const moveY = dy / distance * moveSpeed;

                // Mover al jefe hacia el jugador
                this.position.x += moveX;
                this.position.y += moveY;

                // Evitar colisiones con paredes si hay una sala actual
                if (this.currentRoom && this.currentRoom.checkWallCollision(this)) {
                    this.position.x -= moveX;
                    this.position.y -= moveY;
                }
            }
        }

        // Regeneración gradual de vida (hasta 100 puntos totales)
        if (this.isRegenerating && this.currentRegenAmount < this.totalRegenAmount) {
            // 20 puntos por segundo = 20 * deltaTime / 1000 por frame
            const regenAmount = 20 * deltaTime / 1000;
            this.health = Math.min(this.maxHealth, this.health + regenAmount);
            this.currentRegenAmount += regenAmount;

            // Detener regeneración al alcanzar el límite
            if (this.currentRegenAmount >= this.totalRegenAmount) {
                this.isRegenerating = false;
            }
        }

        // Actualizar lista de drones (eliminar los destruidos)
        if (this.drones.length > 0) {
            // Filtrar drones destruidos
            const destroyedDrones = this.drones.filter(drone => drone.health <= 0);

            // Por cada dron destruido, dañar al jefe
            destroyedDrones.forEach(drone => {
                this.damageFromDrone();
            });

            // Actualizar la lista de drones activos
            this.drones = this.drones.filter(drone => drone.health > 0);

            // Actualizar cada dron activo
            this.drones.forEach(drone => {
                if (window.game && window.game.player) {
                    drone.update(deltaTime, window.game.player, this.currentRoom);
                }
            });
        }

        // Actualizar proyectiles si existen
        if (this.projectiles && this.projectiles.length > 0) {
            for (let i = this.projectiles.length - 1; i >= 0; i--) {
                const projectile = this.projectiles[i];

                // Actualizar posición
                projectile.position.x += projectile.velocity.x * deltaTime / 1000;
                projectile.position.y += projectile.velocity.y * deltaTime / 1000;

                // Actualizar tiempo de vida
                projectile.timeAlive += deltaTime;
                if (projectile.timeAlive >= projectile.lifetime) {
                    projectile.isActive = false;
                    this.projectiles.splice(i, 1);
                    continue;
                }

                // Comprobar colisiones con paredes
                if (this.currentRoom) {
                    const tempObj = {
                        position: projectile.position,
                        width: projectile.radius * 2,
                        height: projectile.radius * 2,
                        getHitboxBounds: () => ({
                            x: projectile.position.x - projectile.radius,
                            y: projectile.position.y - projectile.radius,
                            width: projectile.radius * 2,
                            height: projectile.radius * 2
                        })
                    };

                    if (this.currentRoom.checkWallCollision(tempObj)) {
                        projectile.isActive = false;
                        this.projectiles.splice(i, 1);
                        continue;
                    }
                }

                // Comprobar colisión con el jugador
                const player = window.game.player;
                if (player && player.health > 0) {
                    const playerHitbox = player.getHitboxBounds();
                    const projectileHitbox = {
                        x: projectile.position.x - projectile.radius,
                        y: projectile.position.y - projectile.radius,
                        width: projectile.radius * 2,
                        height: projectile.radius * 2
                    };

                    if (this.checkCollision({ position: playerHitbox, width: playerHitbox.width, height: playerHitbox.height }, projectileHitbox)) {
                        player.takeDamage(projectile.damage);
                        projectile.isActive = false;
                        this.projectiles.splice(i, 1);
                        console.log(`Proyectil cargado impactó al jugador por ${projectile.damage} de daño`);
                    }
                }
            }
        }

        // Manejar colisiones con la barrera si está activa
        if (this.shieldDir) {
            const player = window.game.player;
            const barrierLength = this.width * 3; // Barrera más larga (aumentada para mejor simetría)
            const barrierThickness = 20; // Grosor de la barrera
            const barrierDistance = this.barrierDistance || 40; // Distancia reducida para centrar mejor

            // Crear hitbox para la barrera según la dirección
            let barrierHitbox;

            switch (this.shieldDir) {
                case "up":
                    barrierHitbox = {
                        x: this.position.x - barrierLength / 2,
                        y: this.position.y - this.height / 2 - barrierDistance - barrierThickness,
                        width: barrierLength,
                        height: barrierThickness
                    };
                    break;
                case "down":
                    barrierHitbox = {
                        x: this.position.x - barrierLength / 2,
                        y: this.position.y + this.height / 2 + barrierDistance,
                        width: barrierLength,
                        height: barrierThickness
                    };
                    break;
                case "left":
                    barrierHitbox = {
                        x: this.position.x - this.width / 2 - barrierDistance - barrierThickness,
                        y: this.position.y - barrierLength / 2,
                        width: barrierThickness,
                        height: barrierLength
                    };
                    break;
                case "right":
                    barrierHitbox = {
                        x: this.position.x + this.width / 2 + barrierDistance,
                        y: this.position.y - barrierLength / 2,
                        width: barrierThickness,
                        height: barrierLength
                    };
                    break;
            }

            // Registrar la barrera como un muro temporal en la sala actual
            if (!this.barrierWallRegistered && this.currentRoom) {
                // Crear un objeto Rect para la barrera (igual que los muros)
                const barrierWall = {
                    x: barrierHitbox.x,
                    y: barrierHitbox.y,
                    width: barrierHitbox.width,
                    height: barrierHitbox.height
                };

                // Añadir la barrera a los muros de la sala
                if (!this.currentRoom.objects.temporaryWalls) {
                    this.currentRoom.objects.temporaryWalls = [];
                }
                this.currentRoom.objects.temporaryWalls.push(barrierWall);

                // Extender el método checkWallCollision de la sala para incluir muros temporales
                if (!this.currentRoom.originalCheckWallCollision) {
                    this.currentRoom.originalCheckWallCollision = this.currentRoom.checkWallCollision;
                    this.currentRoom.checkWallCollision = function (obj) {
                        // Primero verificar colisión con muros normales
                        if (this.originalCheckWallCollision(obj)) {
                            return true;
                        }

                        // Luego verificar colisión con muros temporales
                        if (this.objects.temporaryWalls) {
                            const objHitbox = obj.getHitboxBounds();
                            return this.objects.temporaryWalls.some(wall =>
                                objHitbox.x + objHitbox.width > wall.x &&
                                objHitbox.x < wall.x + wall.width &&
                                objHitbox.y + objHitbox.height > wall.y &&
                                objHitbox.y < wall.y + wall.height
                            );
                        }

                        return false;
                    };
                }

                this.barrierWallRegistered = true;
            }

            // Comprobar colisiones con proyectiles del jugador
            if (window.game.projectiles) {
                window.game.projectiles.forEach(projectile => {
                    if (projectile.fromPlayer && this.checkCollision(projectile, barrierHitbox)) {
                        projectile.destroy();
                    }
                });
            }
        } else if (this.barrierWallRegistered && this.currentRoom) {
            // Eliminar la barrera cuando ya no está activa
            if (this.currentRoom.objects.temporaryWalls) {
                this.currentRoom.objects.temporaryWalls = [];
            }

            // Restaurar el método original de comprobación de colisiones
            if (this.currentRoom.originalCheckWallCollision) {
                this.currentRoom.checkWallCollision = this.currentRoom.originalCheckWallCollision;
                this.currentRoom.originalCheckWallCollision = null;
            }

            this.barrierWallRegistered = false;
        }
    }

    // Sobrescribir el método takeDamage para añadir aturdimiento
    takeDamage(amount) {
        super.takeDamage(amount);

        // Aturdir al jefe solo cuando tiene la barrera activa
        if (!this.stunned && this.shieldDir) {
            this.stunned = true;
            this.stunTimeLeft = 2000; // 2 segundos de aturdimiento
            // Interrumpir la curación inmediatamente al recibir daño
            if (this.isRegenerating) {
                this.isRegenerating = false;
            }
        }
    }

    // Método para recibir daño cuando un dron es destruido
    damageFromDrone() {
        const damageAmount = 50; // Cantidad fija de daño por dron
        this.health = Math.max(0, this.health - damageAmount);
        console.log(`Supersoldier recibió ${damageAmount} de daño por un dron destruido`);

        // Verificar si el jefe murió por este daño
        if (this.health <= 0) {
            this.die();
        }
    }

    // Función para disparar el proyectil cargado
    fireChargedShot() {
        if (!this.shotDirection || !this.targetPosition) return;

        const sourcePosition = new Vec(
            this.position.x + this.width / 2,
            this.position.y + this.height / 2
        );

        // Crear un proyectil grande
        const projectile = {
            position: new Vec(sourcePosition.x, sourcePosition.y),
            velocity: new Vec(this.shotDirection.x * 400, this.shotDirection.y * 400), // Velocidad alta
            damage: 200, // Daño alto
            radius: 15, // Radio grande
            isActive: true,
            fromPlayer: false,
            color: "yellow",
            lifetime: 3000, // 3 segundos de vida
            timeAlive: 0
        };

        // Añadir el proyectil a la lista de proyectiles
        if (!this.projectiles) this.projectiles = [];
        this.projectiles.push(projectile);

        console.log("Supersoldier disparó un proyectil cargado");
    }

    // Método para dibujar el jefe y sus proyectiles
    draw(ctx) {
        // Dibujar el jefe
        super.draw(ctx);

        // Dibujar drones
        if (this.drones && this.drones.length > 0) {
            this.drones.forEach(drone => {
                if (drone && typeof drone.draw === 'function') {
                    drone.draw(ctx);
                }
            });
        }

        // Dibujar proyectiles
        if (this.projectiles && this.projectiles.length > 0) {
            this.projectiles.forEach(projectile => {
                if (projectile.isActive) {
                    ctx.beginPath();
                    ctx.arc(projectile.position.x, projectile.position.y, projectile.radius, 0, Math.PI * 2);
                    ctx.fillStyle = projectile.color || "yellow";
                    ctx.fill();

                    // Añadir un borde brillante
                    ctx.strokeStyle = "white";
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    // Efecto de brillo
                    ctx.beginPath();
                    ctx.arc(projectile.position.x, projectile.position.y, projectile.radius * 1.5, 0, Math.PI * 2);
                    ctx.strokeStyle = "rgba(255, 255, 0, 0.3)";
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }
            });
        }
    }

    // Método para obtener la hitbox del jefe
    getHitboxBounds() {
        return {
            x: this.position.x,
            y: this.position.y,
            width: this.width,
            height: this.height
        };
    }

    // Función auxiliar para comprobar colisiones
    checkCollision(entity, rect) {
        // Verificar que ambos objetos existen y tienen las propiedades necesarias
        if (!entity || !rect || !entity.position || !rect.x || !rect.y ||
            rect.width === undefined || rect.height === undefined || entity.width === undefined || entity.height === undefined) {
            return false;
        }

        // Usar getHitboxBounds si está disponible
        const entityBounds = entity.getHitboxBounds ? entity.getHitboxBounds() : {
            x: entity.position.x,
            y: entity.position.y,
            width: entity.width,
            height: entity.height
        };

        return (
            entityBounds.x < rect.x + rect.width &&
            entityBounds.x + entityBounds.width > rect.x &&
            entityBounds.y < rect.y + rect.height &&
            entityBounds.y + entityBounds.height > rect.y
        );
    }
}
