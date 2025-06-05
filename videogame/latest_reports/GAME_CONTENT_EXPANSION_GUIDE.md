# 🎮 GAME CONTENT EXPANSION GUIDE

## 📋 **OVERVIEW**

Esta guía explica paso a paso cómo agregar nuevos **enemigos** y **bosses** al juego Shattered Timeline, cubriendo todas las implicaciones tanto en el frontend como en el backend.

---

## 🐺 **PARTE 1: IMPLEMENTAR NUEVOS ENEMIGOS**

### **Paso 1: Planificación del Enemigo**

Antes de implementar, define las características del enemigo:

```
EJEMPLO: Fire Imp
- Nombre: "Fire Imp"
- Tipo: Criatura pequeña de fuego
- Health: 35
- Damage: 15
- Speed: 1.4
- Behavior: "aggressive" (ataca directamente al jugador)
- Gold Reward: 12
- Descripción: "A small demonic creature wreathed in flames"
- Floor recomendado: 3 (Fire themed)
```

### **Paso 2: Agregar a la Base de Datos**

**2.1. Actualizar enemy_types table:**
```sql
INSERT INTO enemy_types (enemy_id, name, health, damage, speed, behavior_pattern, gold_reward, description) VALUES
(21, 'Fire Imp', 35, 15, 1.4, 'aggressive', 12, 'A small demonic creature wreathed in flames');
```

**2.2. Verificar que el API lo detecte:**
```bash
# Probar que el nuevo enemigo aparece en el API
curl http://localhost:3000/api/enemies | jq '.[] | select(.name == "Fire Imp")'
```

### **Paso 3: Crear la Clase Frontend**

**3.1. Crear archivo de la clase del enemigo:**
```
Ubicación: videogame/src/classes/enemies/floor3/FireImp.js
```

**3.2. Implementar la clase:**
```javascript
import { Enemy } from "../../entities/Enemy.js";
import { Vec } from "../../../utils/Vec.js";

export class FireImp extends Enemy {
  constructor(x, y) {
    super(
      new Vec(x, y),    // position
      32,               // width
      32,               // height
      "orange",         // color (temporal - será reemplazado por sprite)
      35,               // health
      15,               // damage
      1.4,              // speed
      "fire_imp"        // enemyTypeName for backend mapping
    );
    
    // Fire-specific properties
    this.fireTrailTimer = 0;
    this.burnDamage = 5;
    this.attackCooldown = 0;
    this.maxAttackCooldown = 2000; // 2 seconds
  }

  update(deltaTime) {
    super.update(deltaTime);
    
    if (this.state === "dead") return;
    
    // Fire trail effect
    this.fireTrailTimer += deltaTime;
    if (this.fireTrailTimer > 500) { // Every 0.5 seconds
      this.createFireTrail();
      this.fireTrailTimer = 0;
    }
    
    // Attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }
    
    // Aggressive behavior - move toward player
    this.moveTowardsPlayer();
  }

  createFireTrail() {
    // Add fire trail effect behind the imp
    // This would create a visual effect in the room
    console.log(`Fire trail created at ${this.position.x}, ${this.position.y}`);
  }

  onDeath() {
    super.onDeath();
    // Fire explosion effect on death
    this.createDeathExplosion();
  }

  createDeathExplosion() {
    // Visual explosion effect
    console.log("Fire imp explodes in flames!");
  }

  // Override attack to add burn effect
  attack(target) {
    if (this.attackCooldown <= 0) {
      super.attack(target);
      this.applyBurnEffect(target);
      this.attackCooldown = this.maxAttackCooldown;
    }
  }

  applyBurnEffect(target) {
    // Apply burning damage over time
    if (target && target.takeDamage) {
      setTimeout(() => {
        if (target.state !== "dead") {
          target.takeDamage(this.burnDamage);
          console.log(`${target.constructor.name} takes ${this.burnDamage} burn damage!`);
        }
      }, 1000);
    }
  }

  draw(ctx) {
    super.draw(ctx);
    
    // Draw fire effects
    if (this.state !== "dead") {
      this.drawFireAura(ctx);
    }
  }

  drawFireAura(ctx) {
    // Simple fire aura effect
    ctx.save();
    ctx.fillStyle = "rgba(255, 100, 0, 0.3)";
    ctx.beginPath();
    ctx.arc(this.position.x + this.width/2, this.position.y + this.height/2, this.width/2 + 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
```

### **Paso 4: Actualizar Enemy Mapping**

**4.1. Agregar alias en enemyMapping.js:**
```javascript
// En videogame/src/utils/enemyMapping.js, función createFrontendAliases()
if (name.includes('imp') || name.includes('fire')) {
    aliases.push('fire_imp');
    aliases.push('imp');
}
```

### **Paso 5: Integrar en Room Generation**

**5.1. Actualizar FloorGenerator para incluir el nuevo enemigo:**
```javascript
// En videogame/src/classes/game/FloorGenerator.js
import { FireImp } from "../enemies/floor3/FireImp.js";

// En el método que genera enemigos para Floor 3:
generateFloor3Enemies(room) {
  const enemies = [];
  const enemyCount = Math.floor(Math.random() * 3) + 2; // 2-4 enemies
  
  for (let i = 0; i < enemyCount; i++) {
    const x = Math.random() * (room.width - 100) + 50;
    const y = Math.random() * (room.height - 100) + 50;
    
    const enemyType = Math.random();
    if (enemyType < 0.3) {
      enemies.push(new FireImp(x, y)); // 30% chance
    } else if (enemyType < 0.6) {
      enemies.push(new FireElemental(x, y));
    } else {
      enemies.push(new LavaSalamander(x, y));
    }
  }
  
  return enemies;
}
```

### **Paso 6: Testing**

**6.1. Verificar en el juego:**
- Llegar al Floor 3
- Confirmar que Fire Imps aparecen
- Verificar que las mecánicas especiales funcionen
- Confirmar que las kills se registran en el backend

**6.2. Revisar logs del backend:**
```bash
# Ver si las kills se registran correctamente
curl http://localhost:3000/api/runs/1/kills | jq '.[] | select(.enemy_name == "Fire Imp")'
```

---

## 🐲 **PARTE 2: IMPLEMENTAR NUEVOS BOSSES**

### **Paso 1: Planificación del Boss**

Define características completas del boss:

```
EJEMPLO: Void Wraith
- Nombre: "Void Wraith"
- Floor: 4 (nuevo floor)
- Health: 800
- Damage: 60
- Speed: 1.1
- Descripción: "Ancient spirit from the void realm"
- Moves: 
  1. "Void Slash" - 70 damage
  2. "Shadow Portal" - Teleport + summon minions
  3. "Life Drain" - Heal self while damaging player
  4. "Void Storm" - Ultimate AoE attack
```

### **Paso 2: Base de Datos - Boss Details**

**2.1. Agregar boss_details:**
```sql
INSERT INTO boss_details (boss_id, enemy_id, name, health, max_health, damage, speed, description, rewards_gold, rewards_experience, special_abilities) VALUES
(103, 103, 'Void Wraith', 800, 800, 60, 1.1, 
'Ancient spirit from the void realm, master of dark magic and soul manipulation. This entity exists between dimensions and commands the power of the void itself.', 
750, 1500, 
'Void Slash: High damage melee attack; Shadow Portal: Teleports and summons minions; Life Drain: Steals health from player; Void Storm: Devastating area attack');
```

**2.2. Agregar boss_moves:**
```sql
INSERT INTO boss_moves (move_id, boss_id, move_name, damage, cooldown, range_value, description, animation_duration) VALUES
-- Void Wraith Moves (Boss 103)
(14, 103, 'Void Slash', 70, 4.0, 120, 'Powerful void-infused melee attack', 1.5),
(15, 103, 'Shadow Portal', 0, 8.0, 0, 'Teleports behind player and summons 2 shadow minions', 2.0),
(16, 103, 'Life Drain', 40, 6.0, 200, 'Drains health from player and heals self for same amount', 2.5),
(17, 103, 'Void Storm', 90, 12.0, 300, 'Ultimate void energy attack affecting entire room', 3.5);
```

### **Paso 3: Crear Clase Boss Frontend**

**3.1. Crear archivo de la clase:**
```
Ubicación: videogame/src/classes/enemies/floor4/VoidWraith.js
```

**3.2. Implementar la clase:**
```javascript
import { Boss } from "../../entities/Boss.js";
import { Vec } from "../../../utils/Vec.js";
import { ShadowMinion } from "./ShadowMinion.js"; // Minion class

export class VoidWraith extends Boss {
  constructor(x, y, game) {
    super(
      new Vec(x, y),    // position
      80,               // width
      80,               // height
      "darkpurple",     // color
      800,              // health
      60,               // damage
      1.1,              // speed
      "void_wraith"     // enemyTypeName
    );
    
    this.game = game;
    this.moves = this.initializeMoves();
    this.currentMoveIndex = 0;
    this.moveCooldown = 0;
    this.isChanneling = false;
    this.channelStartTime = 0;
    this.summonedMinions = [];
  }

  initializeMoves() {
    return [
      {
        name: "Void Slash",
        damage: 70,
        cooldown: 4000,
        range: 120,
        execute: () => this.executeVoidSlash()
      },
      {
        name: "Shadow Portal", 
        damage: 0,
        cooldown: 8000,
        range: 0,
        execute: () => this.executeShadowPortal()
      },
      {
        name: "Life Drain",
        damage: 40,
        cooldown: 6000,
        range: 200,
        execute: () => this.executeLifeDrain()
      },
      {
        name: "Void Storm",
        damage: 90,
        cooldown: 12000,
        range: 300,
        execute: () => this.executeVoidStorm()
      }
    ];
  }

  update(deltaTime) {
    super.update(deltaTime);
    
    if (this.state === "dead") return;
    
    // Update move cooldown
    if (this.moveCooldown > 0) {
      this.moveCooldown -= deltaTime;
    }
    
    // Execute boss AI
    this.executeBossAI(deltaTime);
    
    // Update summoned minions
    this.updateMinions(deltaTime);
  }

  executeBossAI(deltaTime) {
    if (this.moveCooldown <= 0 && !this.isChanneling) {
      const move = this.selectNextMove();
      this.executeMove(move);
    }
  }

  selectNextMove() {
    // Intelligent move selection based on health and situation
    const healthPercentage = this.health / this.maxHealth;
    
    if (healthPercentage < 0.25) {
      // Below 25% health - prefer Void Storm
      return this.moves[3];
    } else if (healthPercentage < 0.5 && this.summonedMinions.length === 0) {
      // Below 50% health and no minions - prefer Shadow Portal
      return this.moves[1];
    } else if (this.health < this.maxHealth * 0.7) {
      // Below 70% health - prefer Life Drain
      return this.moves[2];
    } else {
      // Default to Void Slash
      return this.moves[0];
    }
  }

  executeMove(move) {
    console.log(`Void Wraith uses ${move.name}!`);
    this.isChanneling = true;
    this.channelStartTime = Date.now();
    
    // Execute move after animation duration
    setTimeout(() => {
      move.execute();
      this.moveCooldown = move.cooldown;
      this.isChanneling = false;
    }, 1500); // 1.5 second channel time
  }

  executeVoidSlash() {
    // High damage melee attack
    const player = this.game.player;
    const distance = this.distanceTo(player);
    
    if (distance <= 120) {
      player.takeDamage(70);
      console.log("Void Wraith's Void Slash hits for 70 damage!");
      
      // Add void effect
      this.applyVoidEffect(player);
    }
  }

  executeShadowPortal() {
    // Teleport behind player
    const player = this.game.player;
    this.position.x = player.position.x - 50;
    this.position.y = player.position.y;
    
    // Summon minions
    this.summonShadowMinions();
    console.log("Void Wraith teleports and summons shadow minions!");
  }

  executeLifeDrain() {
    // Drain health from player and heal self
    const player = this.game.player;
    const distance = this.distanceTo(player);
    
    if (distance <= 200) {
      const drainAmount = 40;
      player.takeDamage(drainAmount);
      this.heal(drainAmount);
      console.log(`Void Wraith drains ${drainAmount} health!`);
    }
  }

  executeVoidStorm() {
    // Ultimate area attack
    const player = this.game.player;
    const stormDamage = 90;
    
    // Always hits (room-wide attack)
    player.takeDamage(stormDamage);
    console.log(`Void Storm deals ${stormDamage} damage!`);
    
    // Add screen shake effect
    this.game.screenShake(2000);
  }

  summonShadowMinions() {
    const minionCount = 2;
    for (let i = 0; i < minionCount; i++) {
      const x = this.position.x + (Math.random() - 0.5) * 200;
      const y = this.position.y + (Math.random() - 0.5) * 200;
      
      const minion = new ShadowMinion(x, y);
      this.summonedMinions.push(minion);
      this.game.currentRoom.objects.enemies.push(minion);
    }
  }

  updateMinions(deltaTime) {
    // Remove dead minions from tracking
    this.summonedMinions = this.summonedMinions.filter(minion => 
      minion.state !== "dead"
    );
  }

  applyVoidEffect(target) {
    // Apply void corruption effect
    target.voidCorruption = (target.voidCorruption || 0) + 1;
    console.log(`Player void corruption increased to ${target.voidCorruption}`);
  }

  heal(amount) {
    this.health = Math.min(this.health + amount, this.maxHealth);
  }

  draw(ctx) {
    super.draw(ctx);
    
    // Draw void aura
    this.drawVoidAura(ctx);
    
    // Draw channeling effect
    if (this.isChanneling) {
      this.drawChannelingEffect(ctx);
    }
  }

  drawVoidAura(ctx) {
    ctx.save();
    ctx.fillStyle = "rgba(75, 0, 130, 0.4)";
    ctx.beginPath();
    ctx.arc(
      this.position.x + this.width/2, 
      this.position.y + this.height/2, 
      this.width/2 + 10, 
      0, 
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
  }

  drawChannelingEffect(ctx) {
    const elapsed = Date.now() - this.channelStartTime;
    const progress = Math.min(elapsed / 1500, 1); // 1.5 second channel
    
    ctx.save();
    ctx.strokeStyle = "purple";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(
      this.position.x + this.width/2,
      this.position.y + this.height/2,
      30,
      0,
      Math.PI * 2 * progress
    );
    ctx.stroke();
    ctx.restore();
  }

  onDeath() {
    super.onDeath();
    
    // Boss death effects
    this.createDeathExplosion();
    
    // Remove all summoned minions
    this.summonedMinions.forEach(minion => {
      minion.state = "dead";
    });
    
    console.log("Void Wraith has been defeated!");
  }

  createDeathExplosion() {
    // Epic death explosion effect
    console.log("Void Wraith explodes in a burst of void energy!");
  }
}
```

### **Paso 4: Crear Shadow Minion (Supporting Enemy)**

**4.1. Crear ShadowMinion.js:**
```javascript
import { Enemy } from "../../entities/Enemy.js";
import { Vec } from "../../../utils/Vec.js";

export class ShadowMinion extends Enemy {
  constructor(x, y) {
    super(
      new Vec(x, y),
      20,              // smaller size
      20,
      "black",
      25,              // low health
      8,               // low damage
      1.3,             // fast speed
      "shadow_minion"
    );
    
    this.lifetime = 15000; // Disappear after 15 seconds
    this.spawnTime = Date.now();
  }

  update(deltaTime) {
    super.update(deltaTime);
    
    // Auto-disappear after lifetime
    if (Date.now() - this.spawnTime > this.lifetime) {
      this.state = "dead";
    }
  }

  draw(ctx) {
    // Draw as semi-transparent shadow
    ctx.save();
    ctx.globalAlpha = 0.7;
    super.draw(ctx);
    ctx.restore();
  }
}
```

### **Paso 5: Integrar Boss en Floor Generation**

**5.1. Crear nuevo floor (Floor 4) en FloorGenerator:**
```javascript
// En FloorGenerator.js
generateFloor4() {
  const rooms = [];
  
  // Generate 6 rooms for floor 4
  for (let i = 0; i < 6; i++) {
    let roomType;
    if (i === 5) {
      roomType = "boss"; // Final room is boss
    } else if (i === 4) {
      roomType = "shop";
    } else {
      roomType = "combat";
    }
    
    const room = new Room(
      roomType,
      4, // floor number
      i + 1 // room number
    );
    
    if (roomType === "boss") {
      // Add Void Wraith boss
      const boss = new VoidWraith(
        room.width / 2 - 40,
        room.height / 2 - 40,
        this.game
      );
      room.objects.enemies = [boss];
    } else if (roomType === "combat") {
      room.objects.enemies = this.generateFloor4Enemies(room);
    }
    
    rooms.push(room);
  }
  
  return rooms;
}
```

### **Paso 6: Update Enemy Mapping**

**6.1. Agregar alias para boss y minions:**
```javascript
// En enemyMapping.js
if (name.includes('void') || name.includes('wraith')) {
    aliases.push('void_wraith');
    aliases.push('boss');
}

if (name.includes('shadow') && name.includes('minion')) {
    aliases.push('shadow_minion');
}
```

### **Paso 7: Update Backend API**

**7.1. Agregar room para floor 4 en base de datos:**
```sql
INSERT INTO rooms (room_id, floor_number, room_number, room_type_id, name, description, difficulty_modifier) VALUES
(19, 4, 1, 1, 'Void Gateway', 'The entrance to the void realm', 2.0),
(20, 4, 2, 1, 'Shadow Corridor', 'Dark hallway filled with void energy', 2.1), 
(21, 4, 3, 1, 'Nightmare Chamber', 'Room where reality bends and twists', 2.2),
(22, 4, 4, 2, 'Void Merchant', 'Mysterious trader from another dimension', 1.0),
(23, 4, 5, 6, 'Sanctuary of Light', 'Final rest before the ultimate challenge', 1.0),
(24, 4, 6, 3, 'Void Throne', 'Domain of the Void Wraith', 3.5);
```

### **Paso 8: Testing Completo**

**8.1. Testing de Boss Mechanics:**
```javascript
// En browser console, después de llegar al boss
window.testBossAI = function() {
  const boss = window.game.currentRoom.objects.enemies.find(e => e.constructor.name === 'VoidWraith');
  if (boss) {
    console.log('Testing boss moves...');
    boss.executeVoidSlash();
    setTimeout(() => boss.executeShadowPortal(), 2000);
    setTimeout(() => boss.executeLifeDrain(), 4000);
    setTimeout(() => boss.executeVoidStorm(), 6000);
  }
};
```

**8.2. Verificar Backend Integration:**
```bash
# Verificar que boss kills se registran
curl http://localhost:3000/api/runs/[RUN_ID]/boss-kills

# Verificar moves del boss
curl http://localhost:3000/api/bosses/103/moves
```

---

## 🛠️ **PARTE 3: HERRAMIENTAS Y DEBUGGING**

### **Enemy/Boss Debug Commands**

Agregar al browser console para testing:

```javascript
// Debug commands para testing
window.gameDebug = {
  spawnEnemy: (type, x, y) => {
    const enemyClass = window[type]; // e.g., FireImp, VoidWraith
    if (enemyClass) {
      const enemy = new enemyClass(x || 200, y || 200);
      window.game.currentRoom.objects.enemies.push(enemy);
      console.log(`Spawned ${type} at ${x}, ${y}`);
    }
  },
  
  killAllEnemies: () => {
    window.game.currentRoom.objects.enemies.forEach(e => e.state = "dead");
  },
  
  setBossHealth: (health) => {
    const boss = window.game.currentRoom.objects.enemies.find(e => e instanceof Boss);
    if (boss) {
      boss.health = health;
      console.log(`Boss health set to ${health}`);
    }
  }
};
```

---

## 📋 **CHECKLIST DE IMPLEMENTACIÓN**

### **Para Nuevos Enemigos:**
- [ ] Planeación completa (stats, comportamiento, temática)
- [ ] Entrada en base de datos (enemy_types)
- [ ] Clase frontend creada con comportamiento único
- [ ] Alias agregado en enemyMapping.js
- [ ] Integrado en FloorGenerator 
- [ ] Testing en juego
- [ ] Verificación de kills en backend

### **Para Nuevos Bosses:**
- [ ] Planeación completa (stats, moves, mecánicas)
- [ ] Entradas en base de datos (boss_details, boss_moves)
- [ ] Clase boss frontend con AI completa
- [ ] Moves implementados con efectos
- [ ] Integrado en floor generation
- [ ] Health bar funcional
- [ ] Testing completo de mecánicas
- [ ] Verificación de boss kills en backend

### **Testing Final:**
- [ ] Enemy spawning funciona correctamente
- [ ] Boss AI ejecuta moves apropiadamente
- [ ] Kill tracking registra en backend
- [ ] Performance aceptable con nuevos enemigos
- [ ] Visual effects se muestran correctamente
- [ ] No hay memory leaks o errores de consola

---

**Esta guía proporciona todo lo necesario para expandir el contenido del juego de manera sistemática y manteniendo la arquitectura actual.** 🎯 