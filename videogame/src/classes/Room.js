import { Vec } from './Vec.js';
import { Rect } from './Rect.js';
import { Player } from './Player.js';
import { Coin } from './Coin.js';
import { variables } from '../config.js';

export class Room {
    constructor(layout) {
        this.layout = layout;
        this.tileSize = 32; // Tamaño de cada celda en píxeles
        this.transitionZone = 64; // Zona de activación para la transición
        this.minSafeDistance = 16; // Distancia mínima para evitar activación inmediata
        this.objects = {
            walls: [],
            enemies: [],
            coins: [],
            shop: null,
            boss: null
        };
        this.parseLayout();
    }

    // Parsea el layout ASCII y crea los objetos correspondientes
    parseLayout() {
        const rows = this.layout.trim().split('\n');
        const height = rows.length;
        const width = rows[0].length;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const char = rows[y].charAt(x);
                const position = new Vec(x * this.tileSize, y * this.tileSize);

                switch (char) {
                    case 'W': // Pared
                        this.objects.walls.push(new Rect(
                            position.x,
                            position.y,
                            this.tileSize,
                            this.tileSize
                        ));
                        break;
                    case 'E': // Enemigo
                        // TODO: Implementar creación de enemigos
                        break;
                    case 'C': // Moneda
                        const coin = new Coin(
                            position,
                            this.tileSize,
                            this.tileSize,
                            'yellow',
                            8
                        );
                        coin.setSprite('./assets/sprites/coin_gold.png', new Rect(0, 0, 32, 32));
                        coin.setAnimation(0, 7, true, variables.animationDelay);
                        this.objects.coins.push(coin);
                        break;
                    case 'S': // Tienda
                        // TODO: Implementar creación de tienda
                        break;
                    case 'B': // Jefe
                        // TODO: Implementar creación de jefe
                        break;
                }
            }
        }
    }

    // Dibuja todos los objetos de la sala
    draw(ctx) {
        // Dibujar paredes
        ctx.fillStyle = 'gray';
        this.objects.walls.forEach(wall => {
            ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        });

        // Dibujar monedas
        this.objects.coins.forEach(coin => coin.draw(ctx));

        // TODO: Dibujar enemigos, tienda y jefe
    }

    // Actualiza todos los objetos de la sala
    update(deltaTime) {
        this.objects.coins.forEach(coin => coin.update(deltaTime));
        // TODO: Actualizar enemigos, tienda y jefe
    }

    // Verifica colisiones con paredes
    checkWallCollision(obj) {
        return this.objects.walls.some(wall => {
            return obj.position.x + obj.width > wall.x &&
                   obj.position.x < wall.x + wall.width &&
                   obj.position.y + obj.height > wall.y &&
                   obj.position.y < wall.y + wall.height;
        });
    }

    // Verifica si el jugador está cerca del borde derecho central
    isPlayerAtRightEdge(player) {
        const rightEdge = variables.canvasWidth - player.width;
        
        // Primero verificar si el jugador está en la zona de transición
        if (player.position.x < rightEdge - this.transitionZone) {
            return false;
        }
        
        // Solo si está en la zona de transición, hacer el chequeo completo
        const middleY = variables.canvasHeight / 2;
        const isAtRightEdge = player.position.x >= rightEdge - this.transitionZone;
        const isAtMiddleY = Math.abs(player.position.y + player.height/2 - middleY) < player.height;
        
        if (isAtRightEdge && isAtMiddleY) {
            console.log("Player in right transition zone");
        }
        
        return isAtRightEdge && isAtMiddleY;
    }

    // Verifica si el jugador está cerca del borde izquierdo central
    isPlayerAtLeftEdge(player) {
        // Primero verificar si el jugador está en la zona de transición
        if (player.position.x > this.transitionZone) {
            return false;
        }
        
        // Solo si está en la zona de transición, hacer el chequeo completo
        const middleY = variables.canvasHeight / 2;
        const isAtLeftEdge = player.position.x <= this.transitionZone;
        const isAtMiddleY = Math.abs(player.position.y + player.height/2 - middleY) < player.height;
        
        if (isAtLeftEdge && isAtMiddleY) {
            console.log("Player in left transition zone");
        }
        
        return isAtLeftEdge && isAtMiddleY;
    }

    // Obtiene la posición inicial del jugador (borde izquierdo)
    getPlayerStartPosition() {
        return new Vec(
            this.transitionZone + this.minSafeDistance,
            variables.canvasHeight / 2 - 32
        );
    }

    // Obtiene la posición del jugador para el borde derecho
    getPlayerRightEdgePosition() {
        return new Vec(
            variables.canvasWidth - this.transitionZone - this.minSafeDistance - 64, // 64 es el ancho del jugador
            variables.canvasHeight / 2 - 32
        );
    }
} 