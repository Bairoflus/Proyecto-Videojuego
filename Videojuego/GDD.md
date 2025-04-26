**4.2.1 Actividad Diseño de Juego**  
\- \- \-  
Construcción de software y toma de decisiones (Gpo 501\)

**Sergio Jiawei Xuan A01784695**

**Erick Alonso Morales Diéguez A01029293**

**Fausto Izquierdo Véjar A01785221**

Código de clase:

TC2005B.501

**Profesor@:**

Octavio Navarro Hinojosa

Esteban Castillo Juarez

Gilberto Echeverría Furió

Fecha de entrega:  
22 de marzo de 2025

# **Shattered Timeline**

## **_Game Design Document_**

All rights reserved. Developed by the Shattered Timeline team.

## Index

1. [Game Design](#game-design)
   - [Summary](#summary)
   - [Gameplay](#gameplay)
   - [Mindset](#mindset)
2. [Technical](#technical)
   - [Screens](#screens)
   - [Controls](#controls)
   - [Mechanics](#mechanics)
3. [Level Design](#level-design)
   - [Themes](#themes)
   - [Game Flow](#game-flow)
4. [Development](#development)
   - [Abstract Classes](#abstract-classes)
   - [Derived Classes / Component Compositions](#derived-classes--component-compositions)
5. [Graphics](#graphics)
   - [Style Attributes](#style-attributes)
   - [Graphics Needed](#graphics-needed)
6. [Sounds/Music](#soundsmusic)
   - [Style Attributes](#style-attributes-1)
   - [Sounds Needed](#sounds-needed)
   - [Music Needed](#music-needed)
7. [Background and Style](#background-and-style)
8. [List of Assets](#list-of-assets)
   - [Graphical Assets](#graphical-assets)
   - [Audio Assets](#audio-assets)
9. [Schedule](#schedule)

---

## Game Design

### Summary

_Shattered Timeline_ is an action-adventure roguelite where players traverse through time—from a primal past to a dystopian future—battling enemies and bosses to restore balance. With procedurally selected rooms, players manage stamina, food, and gear, crafting upgrades and unlocking permanent abilities.

### Gameplay

Players explore 3 dynamic floors, each with 7 rooms:

- 5 combat rooms
- 1 shop
- 1 boss room

Players must clear enemies in each room, manage resources like food and stamina, and strategically upgrade weapons and items. Combat relies on real-time action with dashes, attacks, and spell casting. After each floor, players return to a base for permanent upgrades and preparation.

#### Moment-to-Moment Gameplay Example:

- Enter a procedurally chosen room.
- Face 3–5 enemies with varying attacks.
- Defeat enemies → a rift spawns with random loot.
- Choose to heal or conserve resources for the next room.
- After 5 rooms, face the boss. Defeat it to move to the next floor.

### Mindset

The game evokes a sense of challenge and progression. Players will feel tension in battles, relief at the base, and excitement in discovering new upgrades. The progression through time and increasingly difficult enemies fosters determination and mastery.

---

## Technical

### Screens

1. **Title Screen**
   - Start
   - Options (Controls, Audio)
   - Statistics (Total and Best Records)
   - Credits
2. **Save Slot Selection**
   - New Game
   - Continue Game (3 max slots)
3. **Game**
   - Inventory
   - HUD (Health, Map, Weapons, Gold, Items, Stamina, Food, Mana)
   - Evaluation / Next Level
4. **Pause Menu**
   - Resume
   - Options
   - Statistics
   - Return to Main Menu
5. **End Credits**

### Controls

- Vector-based movement with diagonal support
- Dash for dodging
- Interact button for objects and abilities
- Controls are remappable

### Mechanics

- **Stamina**: Controls attacks/dodges. Regenerates based on food levels.
- **Food**: Affects stamina regeneration (100% to -25%).
- **Mana**: Used for spells, does not regenerate.
- **DoTs (Damage over Time)**:
  - Bleeding: 5 HP/sec
  - Poison: 3 HP/sec (15 sec duration)
  - Burning: 10 HP/sec (5 sec duration)
- **Upgrades**:
  - Permanent: Weapon unlocks, max health increases.
  - Temporary: Items found during the run (potions, scrolls).
- **Time Travel**: Changes enemies per floor (wolves → mutant rats → robotic drones).
- **Room Selection**: Random from 10 possible per floor.

---

## Level Design

### Themes

1. **Floor 1 - Swamp/Forest/Caves**

   - Mood: Mysterious, primal
   - Ambient: Mist, glowing plants
   - Interactive: Goblins, wolves
   - Challenges: Natural traps, ambushes

2. **Floor 2 - Destroyed City/Factory/School**

   - Mood: Chaotic, broken
   - Ambient: Rubble, flickering lights
   - Interactive: Trolls, ogres, skeletons
   - Challenges: Collapsed floors, moving machinery

3. **Floor 3 - Spaceship/Futuristic Zones**
   - Mood: High-tech, dangerous
   - Ambient: Neon lights, electric panels
   - Interactive: Robotic enemies, laser traps
   - Challenges: Electric fields, altered gravity

### Game Flow

1. Start at Base
2. Enter Portal to Floor 1
3. Clear 5 rooms → Boss
4. Portal to Floor 2 → Repeat
5. Portal to Floor 3 → Repeat
6. Return to Base between runs for crafting/upgrades

---

## Development

### Abstract Classes

- BaseEntity
- BasePlayer
- BaseEnemy
- BaseObject
- BaseWeapon
- BaseItem

### Derived Classes / Component Compositions

#### Player System

- PlayerController
- PlayerMovement
- PlayerCombat
- PlayerInventory
- PlayerStats (Health, Stamina, Mana)
- PlayerUpgrades

#### Enemy System

- EnemyController (Base)
- EnemyMovement
- EnemyCombat
- EnemySpawner
- EnemyStats

#### Combat System

- WeaponHandler
- DamageCalculator
- StatusEffectManager (DoTs)

#### UI System

- HUDController
- MenuManager
- InventoryUI
- StatsDisplay

#### Item System

- ItemDatabase
- ItemPickup
- ConsumableEffect

#### Environment System

- RoomManager
- ProceduralRoomSelector
- PortalController
- ShopManager

#### Game Core

- GameManager
- SceneController
- SaveSystem
- InputHandler

#### Audio System

- AudioManager
- MusicPlayer
- SoundEffectPlayer

---

## Graphics

### Style Attributes

- Pixel-art with dark backgrounds and neon highlights
- Vibrant effects for attacks, abilities, damage feedback
- Clear visual feedback: flicker on damage, debuff icons

### Graphics Needed

1. **Characters**: Player, Enemies (idle, attack, dash)
2. **Environment Tiles**: Forest, City, Factory, Ship
3. **Objects**: Portals, Cooking Stations
4. **UI**: HUD indicators, Menus

---

## Sounds/Music

### Style Attributes

- Futuristic synths and ambient tones
- Intense percussion for combat
- Clear audio feedback: distinct sounds for damage taken, item pickup

### Sounds Needed

- Footsteps, Dashes, Hits, Object Usage
- Hurt, Heal, Level-up cues

### Music Needed

1. Base Theme
2. Floor Themes (1, 2, 3)
3. Boss Theme
4. Ending Theme

---

## Background and Style

- **Story**: The world was fractured by a temporal anomaly. The protagonist must restore balance by defeating enemies that evolve over time.
- **Visual Justification**: Clear visual changes between eras (Primitive → Industrial → Futuristic).
- **Audio Style**: Transition from natural sounds to mechanical and finally digital.

---

## List of Assets

### Graphical Assets

#### Characters

- Player (idle, walking, attacking, dashing)
- Goblin (dagger, bow, mage, shaman variations)
- Wolves (group movement)
- Trolls, Ogres, Skeletons
- Robotic Cyclops, Robotic Bear, Robotic Drone

#### Environment Tiles

- Swamp, Forest, Cave tiles
- Destroyed City, Factory, School tiles
- Spaceship, Futuristic zone tiles

#### Objects

- Portals
- Cooking Stations
- Chests (normal and rare)
- Shop Stalls
- Beds, Cultivation Plots

#### Weapons and Items

- Katana, Bow, Shield, Lightsaber, Laser Pistol, Crossbow, Assault Rifle
- Potions (Health, Mana), Bandages, Antidotes
- Scrolls (Strength Boosts), Boots, Armor

#### UI Elements

- Health, Stamina, Mana Bars
- Gold Counter, Inventory Icons
- Menu Screens (Title, Pause, Options)

### Audio Assets

#### Sound Effects

- Footsteps (dirt, stone, metal)
- Dash, Weapon Swings, Spell Casts
- Damage Taken, Healing, Item Pickups
- Enemy Attacks (growls, robotic noises)
- Environmental (wind, electric hums, fire crackles)

#### Music Tracks

- Base Theme (calm, reflective)
- Floor 1 Theme (mysterious, primal)
- Floor 2 Theme (chaotic, industrial)
- Floor 3 Theme (tense, high-tech)
- Boss Theme (intense, rhythmic)
- Ending Theme (triumphant)

---
