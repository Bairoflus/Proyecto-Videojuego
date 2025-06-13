# Project Directory Structure

## Root Directory
```
videogame/
├── README.md                    # Main project documentation
├── package.json                 # Project dependencies
├── DIRECTORY_STRUCTURE.md       # This file
├── api/                         # Backend API
├── database/                    # Database files
├── src/                         # Frontend source code
├── UML/                         # UML diagrams
├── documentation/              # Additional documentation
└── ilustrations/               # Project illustrations
```

## Frontend (src/)
```
src/
├── README.md                    # Frontend documentation
├── main.js                      # Game entry point
├── server.js                    # Development server
├── config.js                    # Game configuration
├── draw.js                      # Drawing utilities
├── assets/                      # Game assets
│   ├── backgrounds/            # Background images
│   ├── sprites/                # Character sprites
│   ├── sound_assets/           # Audio files
│   └── logos/                  # Game logos
├── pages/                       # Web pages
│   ├── css/                    # Stylesheets
│   │   ├── main.css           # Main styles
│   │   ├── style.css          # General styles
│   │   ├── admin.css          # Admin dashboard styles
│   │   └── credits.css        # Credits page styles
│   ├── html/                   # HTML templates
│   │   ├── landing.html       # Welcome page
│   │   ├── register.html      # Registration page
│   │   ├── login.html         # Login page
│   │   ├── game.html          # Main game page
│   │   ├── admin.html         # Admin dashboard
│   │   ├── stats.html         # Player statistics
│   │   └── credits.html       # Credits page
│   └── js/                     # Page scripts
│       ├── login.js           # Login logic
│       ├── register.js        # Registration logic
│       ├── admin.js           # Admin dashboard logic
│       └── landing.js         # Landing page logic
├── classes/                     # Game classes
│   ├── game/                   # Game engine
│   │   ├── Game.js            # Main game engine
│   │   ├── FloorGenerator.js  # Level generation
│   │   └── Game.legacy.js     # Legacy game version
│   ├── entities/               # Game entities
│   │   ├── Player.js          # Player character
│   │   ├── Enemy.js           # Base enemy class
│   │   ├── Boss.js            # Boss enemy
│   │   ├── Shop.js            # Shop system
│   │   ├── Projectile.js      # Projectile system
│   │   ├── RangedEnemy.js     # Ranged enemies
│   │   ├── MeleeEnemy.js      # Melee enemies
│   │   ├── Chest.js           # Treasure chests
│   │   ├── GameObject.js      # Base game object
│   │   ├── AnimatedObject.js  # Animation system
│   │   └── Coin.js            # Currency items
│   ├── rooms/                  # Room system
│   │   └── Room.js            # Room management
│   ├── ui/                     # UI components
│   │   └── UI.js              # User interface
│   ├── config/                 # Configuration
│   └── enemies/                # Enemy types
├── utils/                       # Utilities
│   ├── api.js                  # API client
│   ├── saveStateManager.js     # Save system
│   ├── weaponUpgradeManager.js # Weapon upgrades
│   ├── SimpleAudioManager.js   # Audio system
│   ├── BackgroundManager.js    # Background system
│   ├── EnhancedErrorHandler.js # Error handling
│   ├── enemyMapping.js         # Enemy configuration
│   ├── roomMapping.js          # Room configuration
│   ├── Logger.js               # Logging system
│   ├── auth.js                 # Authentication
│   ├── Vec.js                  # Vector math
│   ├── Rect.js                 # Rectangle math
│   ├── TextLabel.js            # Text rendering
│   └── utils.js                # General utilities
├── constants/                   # Game constants
│   ├── gameEnums.js            # Game enumerations
│   └── gameConstants.js        # Game constants
└── ui/                          # UI components
    └── components/             # Reusable UI
        └── EnhancedLoadingSystem.js # Loading system
```

## Backend API (api/)
```
api/
├── README.md                    # API documentation
├── app.js                       # Main API server
├── package.json                 # Node.js dependencies
└── package-lock.json            # Dependency lock file
```

## Database (database/)
```
database/
├── README.md                    # Database documentation
├── dbshatteredtimeline.sql      # Main database schema
├── objects.sql                  # Views and procedures
├── admin_user_setup.sql         # Admin user setup
└── ERDV4.pdf                    # Entity Relationship Diagram
```

## Documentation (documentation/)
```
documentation/
└── [Additional documentation files]
```

## UML (UML/)
```
UML/
└── [UML diagram files]
```

## Illustrations (ilustrations/)
```
ilustrations/
└── [Project illustration files]
```

## File Sizes and Line Counts

### Frontend Core Files
- `Game.js`: 106KB, 2,870 lines
- `Player.js`: 55KB, 1,743 lines
- `FloorGenerator.js`: 26KB, 644 lines
- `api.js`: 29KB, 868 lines
- `app.js`: 60KB, 1,897 lines

### Database Files
- `dbshatteredtimeline.sql`: 16KB, 424 lines
- `objects.sql`: 34KB, 926 lines
- `admin_user_setup.sql`: 2.6KB, 81 lines

### Documentation
- `README.md` (root): 13KB, 348 lines
- `README.md` (src): 19KB, 613 lines
- `README.md` (api): 10KB, 230 lines
- `README.md` (database): 9.8KB, 307 lines

## Notes
- All JavaScript files use ES6 modules
- HTML files are served from the pages directory
- CSS files are organized by page/component
- Game assets are stored in the assets directory
- Core game logic is in the classes directory
- Utility functions are in the utils directory
- Constants and configurations are in the constants directory 