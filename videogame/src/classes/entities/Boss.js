import { Enemy } from "./Enemy.js";
import { AnimatedObject } from "./AnimatedObject.js";
import { registerBossKill } from "../../utils/api.js";
import { enemyMappingService } from "../../utils/enemyMapping.js";

export class Boss extends Enemy {
    constructor(position, width, height, color, maxHp, attacks = [], enemyTypeName = "dragon") {
        super(position, width, height, color, 1, "boss", 0, 0, maxHp, enemyTypeName);
        this.attacks = attacks;
        this.phase = 1;
        this.nextAttackTime = 0;
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
     * Override die method to register both enemy kill and boss kill
     */
    die() {
        this.state = "dead";
        console.log(`Boss ${this.type} died`);
        
        // Track kill in global game statistics
        if (window.game && typeof window.game.trackKill === 'function') {
            window.game.trackKill();
        }

        // Register enemy kill with backend (from parent class)
        this.registerKill().catch(error => {
            console.error('Failed to register enemy kill for boss:', error);
        });

        // Register specific boss kill
        this.registerBossKill().catch(error => {
            console.error('Failed to register boss kill:', error);
        });

        // EVENT-DRIVEN UPDATE: Update room state when boss dies
        if (this.currentRoom) {
            console.log("Updating room after boss death");
            
            // Update the room state in floor generator
            if (window.game && window.game.floorGenerator) {
                window.game.floorGenerator.updateRoomState(undefined, this.currentRoom);
                console.log("Room state updated due to boss death");
            }
        }
    }

    /**
     * Register boss kill with backend system
     * @returns {Promise<boolean>} Success status
     */
    async registerBossKill() {
        try {
            // Get required data from localStorage and game state
            const userId = localStorage.getItem('currentUserId');
            const runId = localStorage.getItem('currentRunId');
            
            // Validate required data exists
            if (!userId || !runId) {
                console.warn('Boss kill registration skipped: Missing required session data', {
                    userId: !!userId,
                    runId: !!runId
                });
                return false;
            }

            // Get current room ID from floor generator
            const roomId = window.game?.floorGenerator?.getCurrentRoomId();
            if (!roomId) {
                console.warn('Boss kill registration skipped: Could not determine current room ID');
                return false;
            }

            // Get enemy ID from mapping service (for boss we need the boss ID)
            const enemyId = enemyMappingService.getEnemyId(this.enemyTypeName);
            if (!enemyId) {
                console.warn(`Boss kill registration skipped: Could not map boss type "${this.enemyTypeName}" to ID`);
                return false;
            }

            // Prepare boss kill data
            const killData = {
                userId: parseInt(userId),
                enemyId: enemyId,
                roomId: roomId
            };

            console.log(`Registering boss kill:`, {
                bossType: this.enemyTypeName,
                enemyId: enemyId,
                roomId: roomId,
                userId: parseInt(userId)
            });

            // Call backend API to register boss kill
            const result = await registerBossKill(runId, killData);
            
            console.log('Boss kill registered successfully:', result);
            return true;

        } catch (error) {
            console.error('Failed to register boss kill:', error);
            // Don't throw error to prevent game disruption
            return false;
        }
    }

    draw(ctx) {
        AnimatedObject.prototype.draw.call(this, ctx);
    }
}
