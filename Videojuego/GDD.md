# Shattered Timeline

## Game Design Document

---

## Index

1. Game Design

   1. Summary
   2. Gameplay
   3. Mindset
2. Technical

   1. Screens
   2. Controls
   3. Mechanics
3. Level Design

   1. Themes
   2. Game Flow
4. Development

   1. Abstract Classes
   2. Derived Classes
5. Graphics

   1. Style Attributes
   2. Graphics Needed
6. Sounds/Music

   1. Style Attributes
   2. Sounds Needed
   3. Music Needed
7. Background and Style
8. List of Assets
9. Schedule

---

## 1. Game Design

### 1.1 Summary

**Shattered Timeline** is a top-down action roguelite where players battle across three timelines—past, present, and future—to restore a fractured reality. Players navigate combat rooms, face bosses, and use a central base to craft items and upgrade abilities between runs.

### 1.2 Gameplay

Each run spans three floors, each with 7 rooms: 5 combat rooms, 1 shop, and 1 boss room. Rooms are selected from a pool of 10 designs per floor. Combat involves real-time movement, attacks, dodges, and potential spell use. Players manage **stamina**, **food**, and possibly **mana**, choosing between light/heavy attacks, dashes, or ranged options—all with specific stamina costs. A unique food system alters stamina regeneration rates, and running out causes HP loss. Loot drops from rift portals after clearing a room.

**Sample moment-to-moment loop:**

* Enter combat room
* Fight 3–6 enemies
* Clear wave → portal opens with rewards
* Choose upgrade or resource conservation
* After 5 rooms, enter boss room → defeat boss → proceed to next floor
* Return to base after all 3 floors

### 1.3 Mindset

We aim for players to feel progression and mastery through tough challenges. Combat brings tension, exploration yields surprise, and base upgrades provide relief. The layered system encourages experimentation, adaptability, and replayability.

---

## 2. Technical

### 2.1 Screens

1. **Title Screen**

   * Start
   * Options (Controls, Audio)
   * Statistics
   * Credits
2. **Game Start**

   * New Game
   * Continue Game (3 slots max)
3. **Game Screens**

   * Inventory
   * HUD (Health, Map, Weapons, Gold, Items, Stamina, Food, Mana \[optional])
4. **Pause Menu**

   * Resume
   * Save
   * Options
   * Statistics
   * Return to Main Menu
5. **End Credits**

### 2.2 Controls

* 8-direction movement using keyboard or controller
* Dash for evasive maneuvers
* Action button to attack or interact
* Controls are remappable

### 2.3 Mechanics

**Stamina** governs player actions:

* Light Melee Attack: 15
* Heavy Melee Attack: 40
* Light Ranged Attack: 10
* Charged Ranged Attack: 30
* Dash: 20

**Food-Based Regeneration:**

* Full (100–76%): 15 pts/s
* Well Fed (75–51%): 10 pts/s
* Hungry (50–26%): 6 pts/s
* Weak (25–1%): 3 pts/s
* Malnourished (0%): 1 pts/s + lose 5 HP/s

**Status Effects (DoTs):**

* Bleed: Moderate damage, lasts long, can heal with bandages
* Poison: Long duration, cured only by antidotes, dash causes damage
* Burn: Highest damage, shortest duration, cured faster by dashing
* Secondary states: Hemorrhage (bleed x2) and Toxicity (poison x2)

**Mana:** Is used for spell casting (non-regenerative)

**Combat Notes:**

* Enemies track players to get within attack range
* All attacks can be dodged
* Bosses have unique attack phases

---

## 3. Level Design

### 3.1 Themes

1. **Floor 1 - Past**: Swamps, forests, caves. Primitive enemies like goblins and wolves.
2. **Floor 2 - Present**: Destroyed cities, factories, schools. Human enemies (bandidos, police).
3. **Floor 3 - Future**: Spaceships, sci-fi zones. Robots and aliens.

**Base**: A central hub in a forest. Players cook, rest, cultivate, craft food and weapons.

### 3.2 Game Flow

1. Begin at Base
2. Portal to Floor 1 → 5 rooms → Boss
3. Floor 2 → Repeat
4. Floor 3 → Repeat
5. Return to Base → Upgrade/Prepare for next run

---

## 4. Development

### 4.1 Abstract Classes

* BaseEntity
* BasePlayer
* BaseEnemy
* BaseWeapon
* BaseItem
* BaseRoom
* BaseBoss

### 4.2 Derived Classes

**Player:** Movement, Stats, Inventory, Combat, Dash

**Enemies:**

* Floor 1: Goblins (dagger, bow, mage, shaman), Ogres
* Floor 2: Bandids, Snipers, Cops, Mutants
* Floor 3: Robots, Drones, Alien Slaves, Alien Warriors

**Bosses:**

* Floor 1: Dragon / Ogre Boss
* Floor 2: Supersoldier / Criminal Boss
* Floor 3: Alien / Mecha

**Items:** Potions, Scrolls, Bandages, Antidotes

**Weapons:** Katana, Bow, Shield, Laser Pistol, Assault Rifle, Lightsaber

---

## 5. Graphics

### 5.1 Style Attributes

* Pixel-art
* Dark environments + vibrant highlights
* Clear visual feedback for hits/status effects

### 5.2 Graphics Needed

* Characters (idle, attack, dash)
* Enemies by tier and floor
* Bosses (unique sprites)
* UI (HUD, menus)
* Items and weapons
* Environmental tiles (swamp, city, futuristic)

---

## 6. Sounds/Music

### 6.1 Style Attributes

* Floor 1: Natural ambiance
* Floor 2: Industrial noise
* Floor 3: Digital/sci-fi
* Battle music: Intense per floor
* Boss music: Dramatic with unique motifs

### 6.2 Sounds Needed

* Footsteps (terrain-based)
* Attack/damage sounds
* Object pickups
* Status effects (burn, poison, bleed)
* Boss attack audio

### 6.3 Music Needed

* Base theme
* Floor 1, 2, 3 themes
* Boss themes (at least 3 variations)
* Ending theme

---

## 7. Background and Style

A temporal fracture scattered eras across one world. You are a lone fighter traveling across time to stabilize it. The game’s visuals reflect the era progression, while the soundtrack evolves from organic to digital. The story unfolds subtly through enemy design and world transitions.

---

## 8. List of Assets

### Graphical

* Characters: Player + 10+ enemy types + 6 bosses
* Weapons: 8 (melee + ranged)
* Items: Bandages, antidotes, scrolls, potions
* UI Elements: HUD bars, menus
* Tilesets: Swamp, city, factory, spaceship
* Shop + Base: Cultivation, beds, crafting tables

### Audio

* 4–5 music tracks (1 base, 3 floor, 1 boss, 1 ending)
* Sound FX for attacks, footsteps, pickups, UI

---

## 9. Schedule

1. **Week 1–2**: Base entity and player setup
2. **Week 3–4**: Enemy behavior and physics
3. **Week 5**: Room selection + procedural logic
4. **Week 6–7**: Combat + upgrade system
5. **Week 8–9**: Level design + bosses
6. **Week 10**: UI + stats + menus
7. **Week 11–12**: Polish, audio, bug fixing

