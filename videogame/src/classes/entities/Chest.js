/**
 * Chest class for gold rewards
 * Spawns after clearing all enemies in a combat room
 * Provides gold reward when collected by player
 */
import { GameObject } from "./GameObject.js";
import { Vec } from "../../utils/Vec.js";
import { Rect } from "../../utils/Rect.js";
import { variables } from "../../config.js";

export class Chest extends GameObject {
    constructor(position) {
        super(position, 64, 64, "gold", "chest");
        
        // Chest properties
        this.goldReward = 150; // Base gold reward amount
        this.isCollected = false;
        this.isOpen = false;
        
        // Animation properties
        this.animationTimer = 0;
        this.glowIntensity = 0;
        
        // Don't try to load sprite for now, just use colored rectangle
        // this.setSprite('./assets/sprites/chest_gold.png', new Rect(0, 0, 64, 64));
    }
    
    /**
     * Collects the chest and awards gold to player
     * @param {Player} player - The player collecting the chest
     * @returns {number} Amount of gold awarded
     */
    collect(player) {
        if (this.isCollected) return 0;
        
        this.isCollected = true;
        this.isOpen = true;
        
        // Award gold to player
        const goldAwarded = this.goldReward;
        player.addGold(goldAwarded);
        
        return goldAwarded;
    }
    
    /**
     * Updates chest animation
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        if (!this.isCollected) {
            // Gentle glow animation for uncollected chest
            this.animationTimer += deltaTime;
            this.glowIntensity = Math.sin(this.animationTimer * 0.003) * 0.3 + 0.7;
        }
    }
    
    /**
     * Draws the chest with glow effect
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        if (this.isCollected) return; // Don't draw if collected
        
        ctx.save();
        
        // Draw glow effect for uncollected chest
        if (!this.isCollected) {
            ctx.shadowColor = 'gold';
            ctx.shadowBlur = 20 * this.glowIntensity;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }
        
        // Draw chest as golden rectangle
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
        
        // Draw inner chest detail
        ctx.fillStyle = '#B8860B';
        ctx.fillRect(
            this.position.x + 8, 
            this.position.y + 16, 
            this.width - 16, 
            this.height - 24
        );
        
        // Draw chest lid line
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y + this.height / 2);
        ctx.lineTo(this.position.x + this.width, this.position.y + this.height / 2);
        ctx.stroke();
        
        // Draw lock/latch in center
        ctx.fillStyle = '#444';
        ctx.fillRect(
            this.position.x + this.width/2 - 6,
            this.position.y + this.height/2 - 8,
            12,
            16
        );
        
        ctx.restore();
        
        // Draw hitbox in debug mode
        if (variables.showHitboxes) {
            ctx.save();
            const hitbox = this.getHitboxBounds();
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
            ctx.restore();
        }
    }
    
    /**
     * Gets safe spawn position near room transition
     * @param {number} canvasWidth - Width of canvas
     * @param {number} canvasHeight - Height of canvas
     * @returns {Vec} Safe position for chest
     */
    static getSafeSpawnPosition(canvasWidth, canvasHeight) {
        // Spawn chest near right edge but not in transition zone
        const transitionZoneWidth = 64;
        const safeMargin = 32;
        
        const x = canvasWidth - transitionZoneWidth - this.width - safeMargin;
        const y = canvasHeight / 2 - this.height / 2;
        
        return new Vec(x, y);
    }
} 