import { Vec } from './Vec.js';
import { Rect } from './Rect.js';
import { Player } from './Player.js';
import { Coin } from './Coin.js';
import { GoblinDagger } from './enemies/floor1/GoblinDagger.js';
import { GoblinArcher } from './enemies/floor1/GoblinArcher.js';
import { variables } from '../config.js';

export class Room {
    constructor(layout, isCombatRoom = false) {
        this.layout = layout;
        this.isCombatRoom = isCombatRoom;
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
        
        // Generate enemies procedurally if this is a combat room
        if (this.isCombatRoom) {
            this.generateEnemies();
        }
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

        // Draw enemies
        this.objects.enemies.forEach(enemy => enemy.draw(ctx));

        // TODO: Draw shop and boss
    }

    // Updates all room objects
    update(deltaTime) {
        this.objects.coins.forEach(coin => coin.update(deltaTime));
        
        // Update enemies
        this.objects.enemies.forEach(enemy => {
            // Ensure enemy has room reference for collision detection
            if (!enemy.currentRoom) {
                enemy.setCurrentRoom(this);
            }
            
            if (enemy.state !== "dead") {
                // Set player as target for enemy AI
                if (window.game && window.game.player) {
                    enemy.target = window.game.player;
                    // Get player hitbox center position
                    const playerHitbox = window.game.player.getHitboxBounds();
                    const playerCenter = new Vec(
                        playerHitbox.x + playerHitbox.width / 2,
                        playerHitbox.y + playerHitbox.height / 2
                    );
                    enemy.moveTo(playerCenter);
                    
                    // For ranged enemies, also call their attack method
                    if (enemy.type === "goblin_archer") {
                        enemy.attack(window.game.player);
                    }
                }
                
                // Update enemy with player reference for projectile handling
                enemy.update(deltaTime, window.game.player);
            } else {
                // Even dead enemies need to update their projectiles
                enemy.update(deltaTime, window.game.player);
            }
        });
        
        // Remove dead enemies from the array
        this.objects.enemies = this.objects.enemies.filter(enemy => enemy.state !== "dead");
        
        // TODO: Update shop and boss
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

    // Generates procedural enemies for combat rooms
    generateEnemies() {
        console.log("🏹 Starting procedural enemy generation for combat room...");
        
        // Generate 6-10 enemies randomly
        const enemyCount = Math.floor(Math.random() * 5) + 6; // 6 to 10 enemies
        
        // Random proportion: 60%-80% common, 20%-40% rare
        const commonPercentage = Math.random() * 0.2 + 0.6; // 0.6 to 0.8
        const commonCount = Math.floor(enemyCount * commonPercentage);
        const rareCount = enemyCount - commonCount;
        
        console.log(`📊 Enemy distribution: ${enemyCount} total | ${commonCount} GoblinDagger (${Math.round(commonPercentage*100)}%) | ${rareCount} GoblinArcher (${Math.round((1-commonPercentage)*100)}%)`);
        
        // Safe zone definition (128x128 centered on left edge)
        const safeZone = {
            x: 0,
            y: variables.canvasHeight / 2 - 64,
            width: 128,
            height: 128
        };
        
        console.log(`🛡️ Safe zone: x=${safeZone.x}, y=${safeZone.y}, w=${safeZone.width}, h=${safeZone.height}`);
        
        let successfulPlacements = 0;
        
        // Generate common enemies (left half, excluding safe zone)
        console.log("⚔️ Generating GoblinDagger enemies (left half)...");
        for (let i = 0; i < commonCount; i++) {
            const position = this.getValidEnemyPosition(true, safeZone);
            if (position) {
                const enemy = new GoblinDagger(position);
                enemy.setCurrentRoom(this); // Set room reference for collision detection
                this.objects.enemies.push(enemy);
                successfulPlacements++;
                console.log(`  ✅ GoblinDagger ${i+1} placed at (${Math.round(position.x)}, ${Math.round(position.y)})`);
            } else {
                console.warn(`  ❌ Failed to place GoblinDagger ${i+1}`);
            }
        }
        
        // Generate rare enemies (right half)
        console.log("🏹 Generating GoblinArcher enemies (right half)...");
        for (let i = 0; i < rareCount; i++) {
            const position = this.getValidEnemyPosition(false, safeZone);
            if (position) {
                const enemy = new GoblinArcher(position);
                enemy.setCurrentRoom(this); // Set room reference for collision detection
                this.objects.enemies.push(enemy);
                successfulPlacements++;
                console.log(`  ✅ GoblinArcher ${i+1} placed at (${Math.round(position.x)}, ${Math.round(position.y)})`);
            } else {
                console.warn(`  ❌ Failed to place GoblinArcher ${i+1}`);
            }
        }
        
        console.log(`🎯 Enemy generation complete: ${successfulPlacements}/${enemyCount} enemies successfully placed`);
        
        // Validate that all enemies are correct instances
        const goblinDaggerCount = this.objects.enemies.filter(e => e.type === "goblin_dagger").length;
        const goblinArcherCount = this.objects.enemies.filter(e => e.type === "goblin_archer").length;
        
        console.log(`🔍 Validation: ${goblinDaggerCount} GoblinDagger, ${goblinArcherCount} GoblinArcher instances created`);
    }
    
    // Gets a valid position for enemy placement
    getValidEnemyPosition(isCommon, safeZone) {
        const maxAttempts = 50; // Prevent infinite loops
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            let x, y;
            
            if (isCommon) {
                // Common enemies: left half (excluding safe zone)
                x = Math.random() * (variables.canvasWidth / 2 - 32);
                y = Math.random() * (variables.canvasHeight - 32);
                
                // Check if position overlaps with safe zone
                if (x < safeZone.x + safeZone.width && 
                    x + 32 > safeZone.x && 
                    y < safeZone.y + safeZone.height && 
                    y + 32 > safeZone.y) {
                    attempts++;
                    continue;
                }
            } else {
                // Rare enemies: right half
                x = Math.random() * (variables.canvasWidth / 2 - 32) + variables.canvasWidth / 2;
                y = Math.random() * (variables.canvasHeight - 32);
            }
            
            const position = new Vec(x, y);
            
            // Create a temporary enemy to test collision
            const tempEnemy = new GoblinDagger(position);
            
            // Check if position is valid (no wall collision)
            if (!this.checkWallCollision(tempEnemy)) {
                return position;
            }
            
            attempts++;
        }
        
        console.warn("Could not find valid position for enemy after", maxAttempts, "attempts");
        return null;
    }
    
    // Checks if the room can transition (no enemies alive)
    canTransition() {
        if (!this.isCombatRoom) {
            console.log("🚪 Transition allowed: Non-combat room");
            return true; // Non-combat rooms can always transition
        }
        
        // Combat rooms require all enemies to be defeated
        const totalEnemies = this.objects.enemies.length;
        const aliveEnemies = this.objects.enemies.filter(enemy => enemy.state !== "dead");
        const deadEnemies = totalEnemies - aliveEnemies.length;
        
        const canTransition = aliveEnemies.length === 0;
        
        if (canTransition) {
            console.log(`🎉 Transition allowed: All enemies defeated! (${deadEnemies}/${totalEnemies} dead)`);
        } else {
            const aliveGoblins = aliveEnemies.map(e => e.type).join(", ");
            console.log(`⛔ Transition blocked: ${aliveEnemies.length}/${totalEnemies} enemies still alive (${aliveGoblins})`);
        }
        
        return canTransition;
    }
}