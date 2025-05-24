/**
 * Shop class
 * Handles shop UI, purchase logic, and upgrade management
 * Displays when player enters a shop room
 */
import { log } from '../../utils/Logger.js';

export class Shop {
    constructor() {
        // Shop configuration
        this.isOpen = false;
        this.selectedIndex = 0;
        this.onCloseCallback = null; // Callback for when shop closes
        
        // Purchase options configuration
        this.options = [
            {
                id: 'melee_upgrade',
                name: 'Primary Weapon Upgrade',
                description: 'Increases melee damage by +3',
                cost: 35,
                maxPurchases: 15,
                purchased: 0,
                damageIncrease: 3,
                type: 'melee'
            },
            {
                id: 'ranged_upgrade',
                name: 'Secondary Weapon Upgrade',
                description: 'Increases ranged damage by +4',
                cost: 40,
                maxPurchases: 15,
                purchased: 0,
                damageIncrease: 4,
                type: 'ranged'
            },
            {
                id: 'health_restore',
                name: 'Full Health Restoration',
                description: 'Restores HP to maximum',
                cost: 50,
                maxPurchases: Infinity,
                purchased: 0,
                type: 'health'
            }
        ];
        
        // UI configuration
        this.uiConfig = {
            backgroundColor: 'rgba(20, 20, 30, 0.95)',
            borderColor: '#444',
            textColor: '#fff',
            selectedColor: '#4CAF50',
            disabledColor: '#666',
            width: 600,
            height: 400,
            optionHeight: 100,
            padding: 20
        };
        
        // Track upgrade counters globally for the run
        this.runUpgrades = {
            melee: 0,
            ranged: 0
        };
    }
    
    /**
     * Opens the shop UI
     */
    open() {
        if (this.isOpen) return; // Prevent redundant opens
        this.isOpen = true;
        this.selectedIndex = 0;
        log.info('Shop opened');
    }
    
    /**
     * Closes the shop UI
     */
    close() {
        if (!this.isOpen) return; // Prevent redundant closes
        this.isOpen = false;
        log.info('Shop closed');
        
        // Execute callback if provided
        if (this.onCloseCallback) {
            this.onCloseCallback();
        }
    }
    
    /**
     * Handles keyboard input for shop navigation
     * @param {string} key - The key pressed
     * @param {Player} player - The player object
     */
    handleInput(key, player) {
        if (!this.isOpen) return;
        
        switch(key) {
            case 'w':
            case 'ArrowUp':
                this.moveSelection(-1);
                break;
            case 's':
            case 'ArrowDown':
                this.moveSelection(1);
                break;
            case 'Enter':
                this.purchaseSelected(player);
                break;
            case 'Escape':
                this.close();
                break;
        }
    }
    
    /**
     * Moves the selection up or down
     * @param {number} direction - Direction to move (-1 for up, 1 for down)
     */
    moveSelection(direction) {
        this.selectedIndex = Math.max(0, Math.min(this.options.length - 1, this.selectedIndex + direction));
    }
    
    /**
     * Attempts to purchase the selected option
     * @param {Player} player - The player making the purchase
     */
    purchaseSelected(player) {
        const option = this.options[this.selectedIndex];
        
        // Check if player has enough gold
        if (player.gold < option.cost) {
            log.warn(`Purchase failed: Not enough gold. Need ${option.cost}, have ${player.gold}`);
            return;
        }
        
        // Check if upgrade limit reached
        if (option.type === 'melee' || option.type === 'ranged') {
            const currentUpgrades = this.runUpgrades[option.type];
            if (currentUpgrades >= option.maxPurchases) {
                log.warn(`Purchase failed: ${option.name} limit reached (${option.maxPurchases}/${option.maxPurchases})`);
                return;
            }
        }
        
        // Check if health restoration is needed
        if (option.type === 'health' && player.health >= player.maxHealth) {
            log.warn('Purchase failed: Already at full health');
            return;
        }
        
        // Process purchase
        player.gold -= option.cost;
        option.purchased++;
        
        // Apply upgrade effects
        switch(option.type) {
            case 'melee':
                this.runUpgrades.melee++;
                player.meleeDamageBonus = (player.meleeDamageBonus || 0) + option.damageIncrease;
                log.info(`Melee damage increased by +${option.damageIncrease}. Total bonus: +${player.meleeDamageBonus}`);
                break;
                
            case 'ranged':
                this.runUpgrades.ranged++;
                player.rangedDamageBonus = (player.rangedDamageBonus || 0) + option.damageIncrease;
                log.info(`Ranged damage increased by +${option.damageIncrease}. Total bonus: +${player.rangedDamageBonus}`);
                break;
                
            case 'health':
                player.health = player.maxHealth;
                log.info(`Health restored to maximum (${player.maxHealth})`);
                break;
        }
        
        log.info(`Purchased: ${option.name} for ${option.cost} gold. Remaining gold: ${player.gold}`);
    }
    
    /**
     * Draws the shop UI
     * @param {CanvasRenderingContext2D} ctx - The canvas context
     * @param {number} canvasWidth - Canvas width
     * @param {number} canvasHeight - Canvas height
     * @param {Player} player - The player object
     */
    draw(ctx, canvasWidth, canvasHeight, player) {
        if (!this.isOpen) return;
        
        const ui = this.uiConfig;
        const x = (canvasWidth - ui.width) / 2;
        const y = (canvasHeight - ui.height) / 2;
        
        // Draw background
        ctx.fillStyle = ui.backgroundColor;
        ctx.fillRect(x, y, ui.width, ui.height);
        
        // Draw border
        ctx.strokeStyle = ui.borderColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, ui.width, ui.height);
        
        // Draw title
        ctx.fillStyle = ui.textColor;
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SHOP', canvasWidth / 2, y + 40);
        
        // Draw player gold
        ctx.font = '20px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`Gold: ${player.gold}`, canvasWidth / 2, y + 70);
        
        // Draw options
        const optionStartY = y + 100;
        this.options.forEach((option, index) => {
            const optionY = optionStartY + (index * ui.optionHeight);
            const isSelected = index === this.selectedIndex;
            const canAfford = player.gold >= option.cost;
            const isMaxed = (option.type === 'melee' && this.runUpgrades.melee >= option.maxPurchases) ||
                           (option.type === 'ranged' && this.runUpgrades.ranged >= option.maxPurchases);
            const isHealthFull = option.type === 'health' && player.health >= player.maxHealth;
            const isDisabled = !canAfford || isMaxed || isHealthFull;
            
            // Draw option background
            if (isSelected) {
                ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
                ctx.fillRect(x + ui.padding, optionY, ui.width - (ui.padding * 2), ui.optionHeight - 10);
            }
            
            // Draw option border if selected
            if (isSelected) {
                ctx.strokeStyle = ui.selectedColor;
                ctx.lineWidth = 2;
                ctx.strokeRect(x + ui.padding, optionY, ui.width - (ui.padding * 2), ui.optionHeight - 10);
            }
            
            // Set text color based on availability
            ctx.fillStyle = isDisabled ? ui.disabledColor : (isSelected ? ui.selectedColor : ui.textColor);
            
            // Draw option name
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(option.name, x + ui.padding + 10, optionY + 25);
            
            // Draw option description
            ctx.font = '16px Arial';
            let description = option.description;
            if (isHealthFull) {
                description = 'Already at full health';
            } else if (isMaxed) {
                description = 'Maximum upgrades reached';
            }
            ctx.fillText(description, x + ui.padding + 10, optionY + 50);
            
            // Draw cost
            ctx.textAlign = 'right';
            ctx.font = 'bold 20px Arial';
            ctx.fillStyle = canAfford ? '#FFD700' : '#FF6B6B';
            ctx.fillText(`${option.cost} gold`, x + ui.width - ui.padding - 10, optionY + 25);
            
            // Draw purchase count / limit for upgrades
            if (option.type === 'melee' || option.type === 'ranged') {
                const currentUpgrades = this.runUpgrades[option.type];
                ctx.font = '14px Arial';
                ctx.fillStyle = isMaxed ? '#FF6B6B' : '#888';
                ctx.fillText(`${currentUpgrades}/${option.maxPurchases}`, x + ui.width - ui.padding - 10, optionY + 50);
            }
        });
        
        // Draw instructions
        ctx.fillStyle = ui.textColor;
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('W/S or ↑/↓: Navigate | Enter: Purchase | ESC: Exit', canvasWidth / 2, y + ui.height - 20);
    }
    
    /**
     * Resets shop state for a new run
     */
    resetForNewRun() {
        this.runUpgrades.melee = 0;
        this.runUpgrades.ranged = 0;
        this.options.forEach(option => {
            option.purchased = 0;
        });
        log.debug('Shop state reset for new run');
    }
    
    /**
     * Gets current upgrade counts
     * @returns {Object} Current upgrade counts
     */
    getUpgradeCounts() {
        return {
            melee: this.runUpgrades.melee,
            ranged: this.runUpgrades.ranged
        };
    }
    
    /**
     * Sets a callback to execute when shop closes
     * @param {Function} callback - Function to call on close
     */
    setOnCloseCallback(callback) {
        this.onCloseCallback = callback;
    }
} 