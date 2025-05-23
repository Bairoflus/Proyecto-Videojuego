import { Vec } from './Vec.js';
import { Rect } from './Rect.js';
import { Player } from './Player.js';
import { Coin } from './Coin.js';
import { variables } from '../config.js';

export class Room {
    constructor(layout) {
        this.layout = layout;
        this.tileSize = 32; // Size of each cell in pixels
        this.transitionZone = 64; // Activation zone for transition
        this.minSafeDistance = 16; // Minimum distance to avoid immediate activation
        this.objects = {
            walls: [],
            enemies: [],
            coins: [],
            shop: null,
            boss: null
        };
        this.parseLayout();
    }

    // Parses the ASCII layout and creates corresponding objects
    parseLayout() {
        const rows = this.layout.trim().split('\n');
        const height = rows.length;
        const width = rows[0].length;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const char = rows[y].charAt(x);
                const position = new Vec(x * this.tileSize, y * this.tileSize);

                switch (char) {
                    case 'W': // Wall
                        this.objects.walls.push(new Rect(
                            position.x,
                            position.y,
                            this.tileSize,
                            this.tileSize
                        ));
                        break;
                    case 'E': // Enemy
                        // TODO: Implement enemy creation
                        break;
                    case 'C': // Coin
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
                    case 'S': // Shop
                        // TODO: Implement shop creation
                        break;
                    case 'B': // Boss
                        // TODO: Implement boss creation
                        break;
                }
            }
        }
    }

    // Draws all room objects
    draw(ctx) {
        // Draw walls
        ctx.fillStyle = 'gray';
        this.objects.walls.forEach(wall => {
            ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        });

        // Draw coins
        this.objects.coins.forEach(coin => coin.draw(ctx));

        // TODO: Draw enemies, shop and boss
    }

    // Updates all room objects
    update(deltaTime) {
        this.objects.coins.forEach(coin => coin.update(deltaTime));
        // TODO: Update enemies, shop and boss
    }

    // Checks for wall collisions using hitboxes
    checkWallCollision(obj) {
        const objHitbox = obj.getHitboxBounds();
        return this.objects.walls.some(wall => {
            return objHitbox.x + objHitbox.width > wall.x &&
                   objHitbox.x < wall.x + wall.width &&
                   objHitbox.y + objHitbox.height > wall.y &&
                   objHitbox.y < wall.y + wall.height;
        });
    }

    // Checks if player is near the central right edge
    isPlayerAtRightEdge(player) {
        const playerHitbox = player.getHitboxBounds();
        const rightEdge = variables.canvasWidth - playerHitbox.width;
        
        // First check if player is in transition zone
        if (playerHitbox.x < rightEdge - this.transitionZone) {
            return false;
        }
        
        // Only if in transition zone, do full check
        const middleY = variables.canvasHeight / 2;
        const isAtRightEdge = playerHitbox.x >= rightEdge - this.transitionZone;
        const isAtMiddleY = Math.abs(playerHitbox.y + playerHitbox.height/2 - middleY) < playerHitbox.height;
        
        if (isAtRightEdge && isAtMiddleY) {
            console.log("Player in right transition zone");
        }
        
        return isAtRightEdge && isAtMiddleY;
    }

    // Checks if player is near the central left edge
    isPlayerAtLeftEdge(player) {
        const playerHitbox = player.getHitboxBounds();
        
        // First check if player is in transition zone
        if (playerHitbox.x > this.transitionZone) {
            return false;
        }
        
        // Only if in transition zone, do full check
        const middleY = variables.canvasHeight / 2;
        const isAtLeftEdge = playerHitbox.x <= this.transitionZone;
        const isAtMiddleY = Math.abs(playerHitbox.y + playerHitbox.height/2 - middleY) < playerHitbox.height;
        
        if (isAtLeftEdge && isAtMiddleY) {
            console.log("Player in left transition zone");
        }
        
        return isAtLeftEdge && isAtMiddleY;
    }

    // Gets player's initial position (left edge)
    getPlayerStartPosition() {
        // Since hitbox is 60% of sprite size, we adjust the position to center it
        const playerWidth = 64; // Full sprite width
        const hitboxWidth = Math.floor(playerWidth * 0.6);
        const hitboxOffset = Math.floor((playerWidth - hitboxWidth) / 2);
        
        return new Vec(
            this.transitionZone + this.minSafeDistance - hitboxOffset,
            variables.canvasHeight / 2 - 32
        );
    }

    // Gets player's position for right edge
    getPlayerRightEdgePosition() {
        // Since hitbox is 60% of sprite size, we adjust the position to center it
        const playerWidth = 64; // Full sprite width
        const hitboxWidth = Math.floor(playerWidth * 0.6);
        const hitboxOffset = Math.floor((playerWidth - hitboxWidth) / 2);
        
        return new Vec(
            variables.canvasWidth - this.transitionZone - this.minSafeDistance - playerWidth + hitboxOffset,
            variables.canvasHeight / 2 - 32
        );
    }
}