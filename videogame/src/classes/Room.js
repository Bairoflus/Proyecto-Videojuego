import { Vec } from './Vec.js';
import { Rect } from './Rect.js';
import { Player } from './Player.js';
import { Coin } from './Coin.js';
import { variables } from '../config.js';

export class Room {
    constructor(layout) {
        this.layout = layout;
        this.tileSize = 32; // Tamaño de cada celda en píxeles
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
        const middleY = variables.canvasHeight / 2;
        const transitionThreshold = 50; // Distancia en píxeles para activar la transición
        
        return player.position.x >= rightEdge - transitionThreshold &&
               Math.abs(player.position.y + player.height/2 - middleY) < player.height;
    }

    // Obtiene la posición inicial del jugador (borde izquierdo)
    getPlayerStartPosition() {
        return new Vec(this.tileSize, variables.canvasHeight / 2 - 32); // 32 es la mitad del tamaño del jugador (64/2)
    }
} 