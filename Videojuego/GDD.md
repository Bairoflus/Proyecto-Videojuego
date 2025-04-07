# **Past Forward \- Fragments of Yesterday**

## ***Game Design Document***

All rights reserved. Developed by the Past Forward team.

## ***Index***

1. Index

2. Game Design

   1. Summary

   2. Gameplay

   3. Mindset

3. Technical

   1. Screens

   2. Controls

   3. Mechanics

4. Level Design

   1. Themes

      1. Ambience

      2. Objects

         1. Ambient

         2. Interactive

      3. Challenges

   2. Game Flow

5. Development

   1. Abstract Classes

   2. Derived Classes

6. Graphics

   1. Style Attributes

   2. Graphics Needed

7. Sounds/Music

   1. Style Attributes

   2. Sounds Needed

   3. Music Needed

8. Schedule

## ***Game Design***

### **Summary**

*Past Forward* is an action-adventure roguelite where you travel through a broken timeline, from a primitive world to an industrial dystopia and finally to a futuristic realm. Fight through waves of enemies and bosses across three dynamic floors while restoring balance to your universe.

### **Gameplay**

Players navigate randomly selected rooms filled with enemies, using a variety of weapons, items, and food to survive. Tactical decisions are crucial: manage your stamina and food levels, craft and upgrade gear in the base, and defeat bosses to progress to the next era.

### **Mindset**

The game encourages a sense of progression and triumph throughout the different floors. Players will feel tension during enemy encounters and relief upon returning to the base to upgrade. We aim to evoke feelings of determination, strategy, and reward.

## ***Technical***

### **Screens**

1. Title Screen

   * Start

   * Options

   * Credits

   * Exit

2. Save Slot Selection

   * New Game

   * Continue Game

3. Game

   * Inventory

   * HUD (Health, Map, Weapons, Gold, Items, Stamina, Food, Mana)

   * Evaluation / Next Level

4. End Credits

### **Controls**

* Diagonal movement enabled using vector input

* Dash / Roll to dodge

* Action buttons to interact with objects and use abilities

* Possible remapping in Options

### **Mechanics**

* Food impacts stamina regeneration rate

* Stamina governs attacks and dodging

* Rooms are randomly selected from a designed pool

* Weapon upgrades, gear crafting, and cooking in base

* Enemy difficulty increases per floor

## ***Level Design***

### **Themes**

1. Swamp / Forest / Caves (Floor 1\)

   * Mood: Mysterious, primal, moody

   * Ambient: Mist, glowing plants, ruins

   * Interactive: Basic goblins, wolves, …

2. Destroyed City / Factory / School (Floor 2\)

   * Mood: Chaotic, broken, abandoned

   * Ambient: Cracked roads, rubble, flickering lights

   * Interactive: Trolls, ogres, …

3. Spaceship / Futuristic Zones (Floor 3\)

   * Mood: High-tech, futuristic, dangerous

   * Ambient: Electric panels, robotic parts, neon lighting

   * Interactive: Golems, laser barriers, …

### **Challenges**

* Wave-based battles per room

* Bosses with unique patterns and phases

### 

### **Game Flow**

1. Start at the base

2. Enter portal to Floor 1

3. Clear 5 rooms, face boss

4. Portal to Floor 2, repeat process

5. Portal to Floor 3, repeat process

6. Return to base between runs for crafting and upgrades

## ***Development***

### **Abstract Classes / Components**

1. BaseEntity

2. BasePlayer

3. BaseEnemy

4. BaseObject

5. BaseWeapon

6. BaseItem

### **Derived Classes / Component Compositions**

* Enemies:

  * Goblin (Bow, wizard), Wolves

  * Dark Elves, Trolls, Ogres

  * Cyclops, Bears, Golems

* Objects:

  * Armor, Boots, Potions, Scrolls

* Weapons:

  * Katana, Bow, Shield, …

  * Pistol, Assault Rifle, Lightsaber, …

## ***Graphics***

### **Style Attributes**

* Pixel-art with rich dark backgrounds and glowing highlights

* Vibrant effects for hits, dashes, item use

* Strong contrast between enemy/projectile vs background

* Visual feedback for damage, status effects, …

### **Graphics Needed**

1. Characters

   * Player (idle, attack, dash)

   * Enemies by type and difficulty

2. Environment Tiles

   * Forest, city, factory, ship, …

3. Objects

   * portal, cooking station, …

4. UI Elements

   * HUD indicators for each stat and item

## ***Sounds/Music***

### **Style Attributes**

* Futuristic synths mixed with ambient environmental tones

* Battle music with heavy drums and rhythm

### **Sounds Needed**

1. Effects:

   * Footsteps (dirt/metal), dash, hits, object usage, chest open

2. Feedback:

   * Hurt, heal...

### **Music Needed**

1. Base theme

2. Floor 1 theme (swamp/forest)

3. Floor 2 theme (ruins/factory)

4. Floor 3 theme (spaceship)

5. Boss theme

6. Ending theme

## ***Schedule***