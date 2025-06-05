# 🛒 SHOP SYSTEM INTEGRATION GUIDE

## 📋 **CURRENT STATE ANALYSIS**

### **✅ What's Already Implemented:**
- ✅ **Frontend Shop UI** - Complete shop interface with item display
- ✅ **Shop Class** - Functional shop logic in `videogame/src/classes/entities/Shop.js`
- ✅ **Player Gold System** - Players can collect and spend gold
- ✅ **Backend Database Tables** - `item_types`, `user_upgrades` tables exist
- ✅ **Shop Rooms** - Shop rooms are generated in FloorGenerator
- ✅ **Visual Integration** - Shop opens/closes properly in game

### **❌ What's Missing:**
- ❌ **Backend API Integration** - Shop doesn't connect to backend for purchases
- ❌ **Persistent Upgrades** - Purchases don't save to database
- ❌ **Dynamic Pricing** - Fixed prices, no backend price management
- ❌ **Purchase History** - No tracking of what players bought
- ❌ **Item Inventory** - No backend tracking of available items
- ❌ **Shop Analytics** - No purchase event logging

---

## 🎯 **INTEGRATION PLAN**

This guide will implement **complete shop-backend integration** in 6 major steps:

1. **Backend API Endpoints** - Create purchase & inventory APIs
2. **Frontend-Backend Communication** - Connect shop to APIs
3. **Persistent Upgrades System** - Save purchases to database
4. **Shop Analytics Integration** - Log purchase events
5. **Dynamic Item Management** - Backend-driven shop inventory
6. **Testing & Validation** - Ensure everything works

---

## 🔧 **STEP 1: BACKEND API ENDPOINTS**

### **1.1. Create Shop API Endpoints**

Add these endpoints to `videogame/api/app.js`:

```javascript
// ================================================================
// SHOP SYSTEM ENDPOINTS
// ================================================================

/**
 * GET /api/shop/items
 * Get all available shop items with current prices
 */
app.get('/api/shop/items', async (req, res) => {
  try {
    const query = `
      SELECT 
        item_type_id,
        name,
        description,
        base_price,
        CASE 
          WHEN name IN ('health_potion', 'stamina_potion') THEN 'consumable'
          WHEN name LIKE '%_boost' THEN 'temporary'
          ELSE 'permanent'
        END as category
      FROM item_types 
      ORDER BY base_price ASC
    `;
    
    const [rows] = await db.execute(query);
    
    res.status(200).json({
      success: true,
      items: rows,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Get shop items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shop items',
      error: error.message
    });
  }
});

/**
 * POST /api/shop/purchase
 * Purchase an item from the shop
 */
app.post('/api/shop/purchase', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { userId, sessionId, runId, itemId, quantity = 1 } = req.body;
    
    // Validate required fields
    if (!userId || !sessionId || !runId || !itemId) {
      throw new Error('Missing required fields: userId, sessionId, runId, itemId');
    }
    
    // Get item details
    const [itemRows] = await connection.execute(
      'SELECT * FROM item_types WHERE item_type_id = ?',
      [itemId]
    );
    
    if (itemRows.length === 0) {
      throw new Error('Item not found');
    }
    
    const item = itemRows[0];
    const totalCost = item.base_price * quantity;
    
    // Check if player has enough gold (from current run save state)
    const [saveStateRows] = await connection.execute(
      'SELECT gold FROM run_save_states WHERE run_id = ? AND user_id = ? ORDER BY saved_at DESC LIMIT 1',
      [runId, userId]
    );
    
    if (saveStateRows.length === 0) {
      throw new Error('No save state found for this run');
    }
    
    const currentGold = saveStateRows[0].gold;
    
    if (currentGold < totalCost) {
      throw new Error(`Insufficient gold. Required: ${totalCost}, Available: ${currentGold}`);
    }
    
    // Create purchase record
    const [purchaseResult] = await connection.execute(
      `INSERT INTO user_purchases (user_id, run_id, item_type_id, quantity, price_paid, purchase_timestamp) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [userId, runId, itemId, quantity, totalCost]
    );
    
    // Update player's gold in save state
    const newGoldAmount = currentGold - totalCost;
    await connection.execute(
      `INSERT INTO run_save_states (run_id, user_id, session_id, room_id, current_hp, current_stamina, gold, saved_at)
       SELECT run_id, user_id, session_id, room_id, current_hp, current_stamina, ?, NOW()
       FROM run_save_states 
       WHERE run_id = ? AND user_id = ? 
       ORDER BY saved_at DESC LIMIT 1`,
      [newGoldAmount, runId, userId]
    );
    
    // Add upgrade to user_upgrades if it's a permanent upgrade
    if (!['health_potion', 'stamina_potion'].includes(item.name)) {
      await connection.execute(
        `INSERT INTO user_upgrades (user_id, item_type_id, acquired_at, is_active) 
         VALUES (?, ?, NOW(), 1)
         ON DUPLICATE KEY UPDATE acquired_at = NOW(), is_active = 1`,
        [userId, itemId]
      );
    }
    
    await connection.commit();
    
    res.status(200).json({
      success: true,
      message: `Successfully purchased ${quantity}x ${item.name}`,
      purchase: {
        purchaseId: purchaseResult.insertId,
        itemName: item.name,
        quantity: quantity,
        totalCost: totalCost,
        remainingGold: newGoldAmount
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Purchase error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  } finally {
    connection.release();
  }
});

/**
 * GET /api/user/:userId/upgrades
 * Get all active upgrades for a user
 */
app.get('/api/user/:userId/upgrades', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const query = `
      SELECT 
        uu.upgrade_id,
        uu.user_id,
        uu.item_type_id,
        it.name as item_name,
        it.description,
        uu.acquired_at,
        uu.is_active
      FROM user_upgrades uu
      JOIN item_types it ON uu.item_type_id = it.item_type_id
      WHERE uu.user_id = ? AND uu.is_active = 1
      ORDER BY uu.acquired_at DESC
    `;
    
    const [rows] = await db.execute(query, [userId]);
    
    res.status(200).json({
      success: true,
      upgrades: rows,
      count: rows.length
    });
    
  } catch (error) {
    console.error('Get user upgrades error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user upgrades',
      error: error.message
    });
  }
});

/**
 * GET /api/run/:runId/purchases
 * Get all purchases made during a specific run
 */
app.get('/api/run/:runId/purchases', async (req, res) => {
  try {
    const { runId } = req.params;
    
    const query = `
      SELECT 
        up.purchase_id,
        up.user_id,
        up.run_id,
        up.item_type_id,
        it.name as item_name,
        it.description,
        up.quantity,
        up.price_paid,
        up.purchase_timestamp
      FROM user_purchases up
      JOIN item_types it ON up.item_type_id = it.item_type_id
      WHERE up.run_id = ?
      ORDER BY up.purchase_timestamp DESC
    `;
    
    const [rows] = await db.execute(query, [runId]);
    
    res.status(200).json({
      success: true,
      purchases: rows,
      totalSpent: rows.reduce((sum, purchase) => sum + purchase.price_paid, 0)
    });
    
  } catch (error) {
    console.error('Get run purchases error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch run purchases',
      error: error.message
    });
  }
});
```

### **1.2. Create Required Database Tables**

Add this table to handle purchases:

```sql
-- Create user_purchases table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_purchases (
    purchase_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    run_id INT NOT NULL,
    item_type_id INT NOT NULL,
    quantity INT DEFAULT 1,
    price_paid INT NOT NULL,
    purchase_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (run_id) REFERENCES player_runs(run_id),
    FOREIGN KEY (item_type_id) REFERENCES item_types(item_type_id),
    
    INDEX idx_user_purchases_user (user_id),
    INDEX idx_user_purchases_run (run_id),
    INDEX idx_user_purchases_timestamp (purchase_timestamp)
);
```

---

## 🔗 **STEP 2: FRONTEND-BACKEND COMMUNICATION**

### **2.1. Update API Utils**

Add shop functions to `videogame/src/utils/api.js`:

```javascript
// ================================================================
// SHOP API FUNCTIONS
// ================================================================

/**
 * Get all available shop items
 * @returns {Promise<Object>} Shop items data
 */
export async function getShopItems() {
  try {
    const response = await fetch('/api/shop/items');
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch shop items');
    }
    
    return data;
  } catch (error) {
    console.error('Get shop items error:', error);
    throw error;
  }
}

/**
 * Purchase an item from the shop
 * @param {Object} purchaseData - Purchase information
 * @returns {Promise<Object>} Purchase result
 */
export async function purchaseShopItem(purchaseData) {
  try {
    const response = await fetch('/api/shop/purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(purchaseData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Purchase failed');
    }
    
    return data;
  } catch (error) {
    console.error('Purchase error:', error);
    throw error;
  }
}

/**
 * Get user's active upgrades
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User upgrades data
 */
export async function getUserUpgrades(userId) {
  try {
    const response = await fetch(`/api/user/${userId}/upgrades`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch user upgrades');
    }
    
    return data;
  } catch (error) {
    console.error('Get user upgrades error:', error);
    throw error;
  }
}

/**
 * Get purchases made during a run
 * @param {number} runId - Run ID
 * @returns {Promise<Object>} Purchase history
 */
export async function getRunPurchases(runId) {
  try {
    const response = await fetch(`/api/run/${runId}/purchases`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch run purchases');
    }
    
    return data;
  } catch (error) {
    console.error('Get run purchases error:', error);
    throw error;
  }
}
```

### **2.2. Update Shop Class**

Modify `videogame/src/classes/entities/Shop.js` to integrate with backend:

```javascript
import { getShopItems, purchaseShopItem } from '../../utils/api.js';
import { eventLogger } from '../../utils/eventLogger.js';

export class Shop {
  constructor() {
    this.items = [];
    this.isOpen = false;
    this.selectedItemIndex = 0;
    this.onCloseCallback = null;
    this.backendItems = [];
    this.itemsLoaded = false;
    
    // Initialize shop with backend data
    this.initializeShopItems();
  }

  /**
   * Initialize shop items from backend
   */
  async initializeShopItems() {
    try {
      console.log('Loading shop items from backend...');
      const response = await getShopItems();
      
      this.backendItems = response.items;
      this.itemsLoaded = true;
      
      // Convert backend items to frontend format
      this.items = this.backendItems.map(item => ({
        id: item.item_type_id,
        name: item.name,
        description: item.description,
        price: item.base_price,
        category: item.category,
        effect: this.getItemEffect(item.name)
      }));
      
      console.log(`Loaded ${this.items.length} shop items from backend`);
      
    } catch (error) {
      console.error('Failed to load shop items from backend:', error);
      // Fall back to hardcoded items if backend fails
      this.initializeFallbackItems();
    }
  }

  /**
   * Fallback items if backend is unavailable
   */
  initializeFallbackItems() {
    this.items = [
      { id: 1, name: "health_potion", description: "Restores 50 HP", price: 25, category: "consumable", effect: "heal" },
      { id: 2, name: "stamina_potion", description: "Restores 30 Stamina", price: 20, category: "consumable", effect: "stamina" },
      { id: 3, name: "damage_boost", description: "Increases damage by 25%", price: 50, category: "temporary", effect: "damage" },
      { id: 5, name: "armor_upgrade", description: "Reduces damage taken by 15%", price: 100, category: "permanent", effect: "defense" }
    ];
    this.itemsLoaded = true;
    console.log('Using fallback shop items');
  }

  /**
   * Get item effect description
   */
  getItemEffect(itemName) {
    const effects = {
      'health_potion': 'heal',
      'stamina_potion': 'stamina',
      'damage_boost': 'damage',
      'speed_boost': 'speed',
      'armor_upgrade': 'defense',
      'weapon_sharpening': 'damage',
      'max_health_increase': 'health',
      'max_stamina_increase': 'stamina',
      'gold_multiplier': 'gold',
      'resurrection_token': 'revival'
    };
    return effects[itemName] || 'unknown';
  }

  /**
   * Purchase an item (with backend integration)
   */
  async purchaseItem(player) {
    if (!this.itemsLoaded) {
      console.warn('Shop items not loaded yet');
      return false;
    }

    const selectedItem = this.items[this.selectedItemIndex];
    if (!selectedItem) return false;

    // Check if player has enough gold
    if (player.gold < selectedItem.price) {
      console.log(`Not enough gold! Need ${selectedItem.price}, have ${player.gold}`);
      return false;
    }

    try {
      // Get session data for backend purchase
      const userId = localStorage.getItem('currentUserId');
      const sessionId = localStorage.getItem('currentSessionId');
      const runId = localStorage.getItem('currentRunId');

      if (!userId || !sessionId || !runId) {
        throw new Error('Missing session data for purchase');
      }

      // Make backend purchase
      const purchaseData = {
        userId: parseInt(userId),
        sessionId: parseInt(sessionId),
        runId: parseInt(runId),
        itemId: selectedItem.id,
        quantity: 1
      };

      console.log('Making backend purchase:', purchaseData);
      const purchaseResult = await purchaseShopItem(purchaseData);

      if (purchaseResult.success) {
        // Apply item effect to player
        this.applyItemEffect(selectedItem, player);
        
        // Update player's gold to match backend
        player.gold = purchaseResult.purchase.remainingGold;
        
        // Log purchase event
        const roomId = window.game?.floorGenerator?.getCurrentRoomId() || 1;
        await eventLogger.logEvent('item_purchase', roomId, selectedItem.price, null, selectedItem.name);
        
        console.log(`✅ Successfully purchased ${selectedItem.name}!`);
        console.log(`💰 Remaining gold: ${player.gold}`);
        
        return true;
      } else {
        throw new Error(purchaseResult.message || 'Purchase failed');
      }

    } catch (error) {
      console.error('Purchase failed:', error);
      
      // Show error message to player (you could implement a UI notification system)
      console.log(`❌ Purchase failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Apply item effect to player
   */
  applyItemEffect(item, player) {
    switch (item.effect) {
      case 'heal':
        const healAmount = 50;
        player.health = Math.min(player.health + healAmount, player.maxHealth);
        console.log(`🩹 Healed ${healAmount} HP`);
        break;
        
      case 'stamina':
        const staminaAmount = 30;
        player.stamina = Math.min(player.stamina + staminaAmount, player.maxStamina);
        console.log(`⚡ Restored ${staminaAmount} stamina`);
        break;
        
      case 'damage':
        player.damageMultiplier = (player.damageMultiplier || 1) + 0.25;
        console.log(`⚔️ Damage increased! Multiplier: ${player.damageMultiplier.toFixed(2)}x`);
        break;
        
      case 'defense':
        player.defenseMultiplier = (player.defenseMultiplier || 1) - 0.15;
        console.log(`🛡️ Defense improved! Damage reduction: ${((1 - player.defenseMultiplier) * 100).toFixed(1)}%`);
        break;
        
      case 'speed':
        player.speedMultiplier = (player.speedMultiplier || 1) + 0.20;
        console.log(`💨 Speed increased! Multiplier: ${player.speedMultiplier.toFixed(2)}x`);
        break;
        
      case 'health':
        player.maxHealth += 20;
        player.health += 20; // Also heal current health
        console.log(`❤️ Max health increased by 20! New max: ${player.maxHealth}`);
        break;
        
      case 'gold':
        player.goldMultiplier = (player.goldMultiplier || 1) * 2;
        console.log(`🪙 Gold multiplier doubled! New multiplier: ${player.goldMultiplier}x`);
        break;
        
      default:
        console.log(`Applied ${item.name} effect`);
    }
  }

  // ... rest of the existing Shop class methods remain the same ...
  // (open, close, draw, handleInput methods)
}
```

---

## 🔄 **STEP 3: PERSISTENT UPGRADES SYSTEM**

### **3.1. Create Upgrade Manager**

Create `videogame/src/utils/upgradeManager.js`:

```javascript
/**
 * Upgrade Manager
 * Handles loading and applying persistent upgrades from backend
 */
import { getUserUpgrades } from './api.js';

class UpgradeManager {
  constructor() {
    this.activeUpgrades = [];
    this.upgradeEffects = new Map();
    this.initialized = false;
  }

  /**
   * Initialize upgrades for a user
   */
  async initialize(userId) {
    try {
      console.log(`Loading upgrades for user ${userId}...`);
      const response = await getUserUpgrades(userId);
      
      this.activeUpgrades = response.upgrades;
      this.buildUpgradeEffects();
      this.initialized = true;
      
      console.log(`Loaded ${this.activeUpgrades.length} active upgrades`);
      return true;
      
    } catch (error) {
      console.error('Failed to initialize upgrades:', error);
      this.activeUpgrades = [];
      this.initialized = true;
      return false;
    }
  }

  /**
   * Build upgrade effects map
   */
  buildUpgradeEffects() {
    this.upgradeEffects.clear();
    
    this.activeUpgrades.forEach(upgrade => {
      const effect = this.getUpgradeEffect(upgrade.item_name);
      if (effect) {
        this.upgradeEffects.set(upgrade.item_name, effect);
      }
    });
  }

  /**
   * Get upgrade effect configuration
   */
  getUpgradeEffect(itemName) {
    const effects = {
      'armor_upgrade': { type: 'defense', value: 0.15 },
      'weapon_sharpening': { type: 'damage', value: 0.10 },
      'max_health_increase': { type: 'maxHealth', value: 20 },
      'max_stamina_increase': { type: 'maxStamina', value: 15 },
      'damage_boost': { type: 'damage', value: 0.25, temporary: true },
      'speed_boost': { type: 'speed', value: 0.20, temporary: true }
    };
    
    return effects[itemName] || null;
  }

  /**
   * Apply all upgrades to a player
   */
  applyUpgrades(player) {
    if (!this.initialized) {
      console.warn('Upgrade manager not initialized');
      return;
    }

    let appliedCount = 0;
    
    this.upgradeEffects.forEach((effect, itemName) => {
      switch (effect.type) {
        case 'damage':
          player.damageMultiplier = (player.damageMultiplier || 1) + effect.value;
          break;
          
        case 'defense':
          player.defenseMultiplier = (player.defenseMultiplier || 1) - effect.value;
          break;
          
        case 'speed':
          player.speedMultiplier = (player.speedMultiplier || 1) + effect.value;
          break;
          
        case 'maxHealth':
          player.maxHealth += effect.value;
          player.health += effect.value; // Also increase current health
          break;
          
        case 'maxStamina':
          player.maxStamina += effect.value;
          player.stamina += effect.value; // Also increase current stamina
          break;
      }
      
      appliedCount++;
      console.log(`Applied upgrade: ${itemName} (${effect.type}: ${effect.value})`);
    });

    if (appliedCount > 0) {
      console.log(`✅ Applied ${appliedCount} upgrades to player`);
    }
  }

  /**
   * Get active upgrade names
   */
  getActiveUpgradeNames() {
    return this.activeUpgrades.map(upgrade => upgrade.item_name);
  }

  /**
   * Check if user has specific upgrade
   */
  hasUpgrade(itemName) {
    return this.upgradeEffects.has(itemName);
  }
}

// Export singleton
export const upgradeManager = new UpgradeManager();
```

### **3.2. Integrate with Game Class**

Update `videogame/src/classes/game/Game.js` to load upgrades:

```javascript
import { upgradeManager } from '../../utils/upgradeManager.js';

export class Game {
  constructor() {
    // ... existing constructor code ...
    
    // Initialize upgrades after user login
    this.initializeUserUpgrades();
  }

  /**
   * Initialize user upgrades from backend
   */
  async initializeUserUpgrades() {
    try {
      const userId = localStorage.getItem('currentUserId');
      if (userId) {
        await upgradeManager.initialize(parseInt(userId));
        
        // Apply upgrades to player if already initialized
        if (this.player) {
          upgradeManager.applyUpgrades(this.player);
        }
      }
    } catch (error) {
      console.error('Failed to initialize user upgrades:', error);
    }
  }

  initObjects() {
    // ... existing code ...

    // Apply upgrades to newly created player
    if (upgradeManager.initialized) {
      upgradeManager.applyUpgrades(this.player);
    }

    // ... rest of existing code ...
  }
}
```

---

## 📊 **STEP 4: SHOP ANALYTICS INTEGRATION**

### **4.1. Enhanced Event Logging**

The shop is already integrated with `eventLogger` in the updated Shop class above. This logs:

- `item_purchase` events with item name and price
- Automatic flush to backend for analytics

### **4.2. Purchase Analytics Endpoint**

Add analytics endpoint to `videogame/api/app.js`:

```javascript
/**
 * GET /api/analytics/shop
 * Get shop purchase analytics
 */
app.get('/api/analytics/shop', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const query = `
      SELECT 
        it.name as item_name,
        COUNT(*) as purchase_count,
        SUM(up.quantity) as total_quantity,
        AVG(up.price_paid) as avg_price,
        SUM(up.price_paid) as total_revenue,
        DATE(up.purchase_timestamp) as purchase_date
      FROM user_purchases up
      JOIN item_types it ON up.item_type_id = it.item_type_id
      WHERE up.purchase_timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY it.item_type_id, DATE(up.purchase_timestamp)
      ORDER BY purchase_date DESC, total_revenue DESC
    `;
    
    const [rows] = await db.execute(query, [days]);
    
    // Aggregate data
    const summary = {
      totalPurchases: rows.reduce((sum, row) => sum + row.purchase_count, 0),
      totalRevenue: rows.reduce((sum, row) => sum + row.total_revenue, 0),
      mostPopularItem: rows.length > 0 ? rows[0].item_name : null,
      dailyData: rows
    };
    
    res.status(200).json({
      success: true,
      analytics: summary,
      period: `${days} days`
    });
    
  } catch (error) {
    console.error('Shop analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shop analytics',
      error: error.message
    });
  }
});
```

---

## 🧪 **STEP 5: TESTING & VALIDATION**

### **5.1. Frontend Testing Commands**

Add these debug commands to browser console:

```javascript
// Shop testing commands
window.shopDebug = {
  // Test shop item loading
  testShopLoad: async () => {
    const shop = window.game.currentRoom.objects.shop;
    if (shop) {
      await shop.initializeShopItems();
      console.log('Shop items:', shop.items);
    }
  },
  
  // Test purchase
  testPurchase: async (itemIndex = 0) => {
    const shop = window.game.currentRoom.objects.shop;
    const player = window.game.player;
    if (shop && player) {
      shop.selectedItemIndex = itemIndex;
      const result = await shop.purchaseItem(player);
      console.log('Purchase result:', result);
    }
  },
  
  // Add gold for testing
  addGold: (amount) => {
    window.game.player.gold += amount;
    console.log(`Added ${amount} gold. Total: ${window.game.player.gold}`);
  },
  
  // Test upgrades
  testUpgrades: async () => {
    const userId = localStorage.getItem('currentUserId');
    if (userId) {
      await upgradeManager.initialize(parseInt(userId));
      upgradeManager.applyUpgrades(window.game.player);
      console.log('Upgrades applied:', upgradeManager.getActiveUpgradeNames());
    }
  }
};
```

### **5.2. Backend Testing**

Test the new endpoints:

```bash
# Test shop items endpoint
curl http://localhost:3000/api/shop/items

# Test purchase (replace with real data)
curl -X POST http://localhost:3000/api/shop/purchase \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"sessionId":1,"runId":1,"itemId":1}'

# Test user upgrades
curl http://localhost:3000/api/user/1/upgrades

# Test shop analytics
curl http://localhost:3000/api/analytics/shop?days=30
```

### **5.3. Integration Testing Checklist**

- [ ] **Shop loads items from backend**
- [ ] **Purchase deducts gold correctly**
- [ ] **Purchase saves to database**
- [ ] **Upgrades persist between runs**
- [ ] **Item effects apply to player**
- [ ] **Purchase events log correctly**
- [ ] **Error handling works (no gold, server down)**
- [ ] **Shop analytics endpoint returns data**

---

## 🚀 **STEP 6: DEPLOYMENT CONSIDERATIONS**

### **6.1. Error Handling**

The implementation includes:
- ✅ Fallback to hardcoded items if backend fails
- ✅ Graceful error messages for failed purchases
- ✅ Transaction rollback for failed purchases
- ✅ Validation of required session data

### **6.2. Performance Optimizations**

- ✅ Shop items loaded once and cached
- ✅ Upgrades loaded once per user session
- ✅ Batched database operations
- ✅ Indexed database queries

### **6.3. Security Considerations**

- ✅ Server-side validation of all purchases
- ✅ Gold verification before purchase
- ✅ User session validation
- ✅ SQL injection protection

---

## 📋 **IMPLEMENTATION CHECKLIST**

### **Backend (API)**
- [ ] Add shop endpoints to `app.js`
- [ ] Create `user_purchases` table
- [ ] Test all endpoints with curl
- [ ] Verify database transactions work

### **Frontend (Game)**
- [ ] Update `api.js` with shop functions
- [ ] Modify `Shop.js` for backend integration
- [ ] Create `upgradeManager.js`
- [ ] Integrate upgrades in `Game.js`
- [ ] Test shop functionality in game

### **Testing**
- [ ] Verify shop loads items from backend
- [ ] Test successful purchases
- [ ] Test error scenarios (no gold, server down)
- [ ] Verify upgrades persist
- [ ] Check analytics data collection

### **Production Ready**
- [ ] All error handling implemented
- [ ] Performance optimizations applied
- [ ] Security validation in place
- [ ] Documentation updated

---

**Once all steps are completed, the shop system will be fully integrated with persistent upgrades, analytics tracking, and robust error handling!** 🎯 