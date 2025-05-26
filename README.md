# Shattered Timeline - Roguelite Video Game
ia 
## Description

Shattered Timeline is a top-down action roguelite video game developed in JavaScript using the Canvas API. The player must traverse multiple floors filled with enemies, collect gold, and upgrade their weapons in shops to progress.

## Main Features

### Combat System

- **Primary Weapon (Dagger)**: Melee attack with extended range (75px)

  - Line-of-sight detection system that limits the attack if walls are present
  - Base damage: 10 points + shop bonuses
  - Attack area visualization (red for normal, orange when limited by walls)

- **Secondary Weapon (Slingshot)**: Ranged attack with projectiles
  - Base damage: 15 points + shop bonuses
  - Projectiles are destroyed upon hitting walls

### Progression System

- **Game Structure**:

  - 3 floors per run
  - 6 rooms per floor (4 combat + 1 shop + 1 boss)
  - Persistent run counter that never resets

- **Gold and Rewards System**:
  - Enemies do not drop gold upon death
  - Golden chests appear after clearing combat rooms (50 gold)
  - Gold is lost upon death

### Shop System

- **Available Upgrades**:

  1. **Primary Weapon Upgrade**: 35 gold, +3 damage, maximum 15 upgrades per run
  2. **Secondary Weapon Upgrade**: 40 gold, +4 damage, maximum 15 upgrades per run
  3. **Full Health Restoration**: 50 gold, no limit

- **Features**:
  - Upgrades are global per run (persist between rooms)
  - Reset upon death
  - Interface with WASD to navigate, Enter to purchase, ESC to exit
  - Visual activation zone in shop rooms

### Enemies

- **Goblin Dagger**: Common melee enemy
- **Goblin Archer**: Ranged enemy that shoots projectiles
- Procedural generation: 6-10 enemies per combat room
- Enemies do not respawn when revisiting previous rooms

### Death and Reset System

- Upon death:
  - Run counter increments (persistent)
  - Resets: floor, room, gold, weapon upgrades
  - Player returns to the start with base stats
  - 1-second delay before reset

## Controls

- **Movement**: WASD or arrow keys
- **Attack**: Spacebar
- **Switch Weapon**: Q (dagger) / E (slingshot)
- **Dash**: Left Shift
- **Shop**: WASD to navigate, Enter to purchase, ESC to exit

## Technical Requirements

- Modern web browser with support for ES6 modules
- Python 3 for the local development server

## Installation and Execution

1. Clone the repository:

```bash
git clone https://github.com/your-username/Proyecto-Videojuego.git
cd Proyecto-Videojuego
```

2. Start the local server:

```bash
cd videogame
python3 -m http.server 8000
```

3. Open your browser and go to:

```
http://localhost:8000/src/
```

## Project Structure

```
videogame/
├── src/
│   ├── assets/         # Sprites and graphic resources
│   ├── classes/        # Game classes
│   │   ├── entities/   # Player, Enemy, Projectile, Shop, etc.
│   │   ├── enemies/    # Specific enemy types
│   │   ├── rooms/      # Room system
│   │   └── game/       # Game controller and FloorGenerator
│   ├── utils/          # Utilities (Vec, Rect, Logger)
│   ├── config.js       # Global configuration
│   ├── main.js         # Entry point
│   └── index.html      # Main page
```

## Implemented Technical Features

### Performance Optimizations

- Event-based state update system (not per frame)
- Efficient collision detection with raycasting
- Smart projectile management

### Persistence

- Room states preserved when navigating between them
- Run counter saved in localStorage
- Global shop upgrade system per run

### Enhanced Combat System

- Line-of-sight detection for melee attacks
- Attacks do not pass through walls
- Clear visual feedback for attack range

## Upcoming Features

- Final boss implementation
- More enemy types
- Special abilities system
- Visual and sound effect improvements
- Progressive difficulty balancing

## Credits

Developed by the Tecnológico de Monterrey - Semester 4 team
