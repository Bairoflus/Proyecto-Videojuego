# 🎮 Shattered Timeline – Use Case Diagrams

This document describes the system architecture of **Shattered Timeline** using three use-case diagrams: **Gameplay**, **Web/API**, and **Database**. These diagrams illustrate how the game components and actors interact across layers.

---

## 1. 🎮 Gameplay Use-Case Diagram

![Gameplay Use-Case Diagram](usecases/use-case-diagram-images/game-client-usecase.png)

**Actors:**
- **Player** – controls character actions in the game.
- **System** – in-game logic engine that handles floor generation, enemies, and bosses.

**Use Cases (Player):**
- Start New Game
- Move / Dash (8 directions)
- Attack (Melee / Ranged)
- Pause / Options
- View Statistics
- Quit to Menu

**Use Cases (System):**
- Generate Procedural Floor
- Control Enemies / Boss Behaviour
- Control Enemies / Boss Generation

---

## 2. 🌐 Web/API Use-Case Diagram

![Web/API Use-Case Diagram](usecases/use-case-diagram-images/Web-API-usecase.png)

**Actor:**
- **Browser** – the player's client interacting with the REST API.

**Use Cases:**
- Register Account
- Login
- Logout
- Retrieve Player Stats
- Update Settings
- Submit Run Stats
- Buy Permanent Upgrade
- Download Game Client

---

## 3. 🗄️ Database Use-Case Diagram

![Database Use-Case Diagram](usecases/use-case-diagram-images/Database-use-case-diagram.png)

**Actor:**
- **REST API** – backend component that connects to the database.

**Use Cases:**
- Create / Verify User
- Maintain Sessions
- Persist Run Progress
- Store Permanent Upgrades
- Store User Audio Settings

---

## 🔄 Summary

| Layer       | Focus                         | Actor(s)         | Purpose                                                   |
|-------------|-------------------------------|------------------|-----------------------------------------------------------|
| Gameplay    | In-game user and system logic | Player, System   | Real-time player input, floor generation, combat logic    |
| Web/API     | Server interface              | Browser          | Account handling, saving progress, stats retrieval        |
| Database    | Data persistence               | REST API         | Store user profiles, settings, stats, and upgrade data    |

---


