import { Vec } from "./Vec.js";
import { Rect } from "./Rect.js";
import { Player } from "./Player.js";
import { Coin } from "./Coin.js";
import { GoblinArcher } from "./enemies/floor1/GoblinArcher.js";
import { GoblinDagger } from "./enemies/floor1/GoblinDagger.js";
import { variables, keyDirections, playerMovement } from "../config.js";
import { boxOverlap } from "../utils.js";

export class Game {
  constructor() {
    this.createEventListeners();
    this.initObjects();
    // Make game instance accessible to other classes
    window.game = this;
  }

  initObjects() {
    this.player = new Player(
      new Vec(variables.canvasWidth / 2, variables.canvasHeight / 2),
      64,

      64,

      "red",

      13
    );
    this.player.setSprite(
      "../assets/sprites/dagger-sprite-sheet.png",
      new Rect(0, 0, 64, 64)
    );
    this.enemies = [
      new GoblinArcher(new Vec(100, 100)),
      new GoblinDagger(new Vec(200, 200)),
    ];
    this.coins = this.generateCoins(10);

    variables.backgroundImage.src = "../assets/background/background.jpg";
  }

  generateCoins(count) {
    const coins = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * (variables.canvasWidth - 32);
      const y = Math.random() * (variables.canvasHeight - 32);
      const coin = new Coin(new Vec(x, y), 32, 32, "yellow", 8);
      coin.setSprite("../assets/sprites/coin_gold.png", new Rect(0, 0, 32, 32));
      coin.setAnimation(0, 7, true, variables.animationDelay);
      coins.push(coin);
    }
    return coins;
  }

  draw(ctx) {
    if (variables.backgroundImage.complete) {
      ctx.drawImage(
        variables.backgroundImage,
        0,
        0,
        variables.canvasWidth,
        variables.canvasHeight
      );
    }

    this.enemies.forEach((enemy) => enemy.draw(ctx));
    this.coins.forEach((coin) => coin.draw(ctx));
    this.player.draw(ctx);
  }

  update(deltaTime) {
    // Remove dead enemies
    this.enemies = this.enemies.filter((enemy) => enemy.state !== "dead");

    // Update remaining enemies
    this.enemies.forEach((enemy) => (enemy.target = this.player));
    this.enemies.forEach((enemy) => enemy.moveTo(this.player.position));
    this.enemies.forEach((enemy) => enemy.attack(this.player));
    this.enemies.forEach((enemy) => enemy.update(deltaTime, this.player));

    this.coins = this.coins.filter((coin) => !boxOverlap(this.player, coin));
    this.coins.forEach((coin) => coin.update(deltaTime));
    this.player.update(deltaTime);
  }

  createEventListeners() {
    window.addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if (keyDirections[k]) {
        this.add_key(keyDirections[k]);
        if (k === "1") {
          this.player.setWeapon("dagger");
          this.player.setSprite(
            "../assets/sprites/dagger-sprite-sheet.png",
            new Rect(0, 0, 64, 64)
          );
          this.player.setMovementAnimation();
        } else if (k === "2") {
          this.player.setWeapon("slingshot");
          this.player.setSprite(
            "../assets/sprites/slingshot-sprite-sheet.png",
            new Rect(0, 0, 64, 64)
          );
          this.player.setMovementAnimation();
        } else if (k === " ") {
          this.player.attack();
        } else {
          this.add_key(keyDirections[k]);
        }
      } else if (k === "shift") {
        // Si la tecla Shift está presionada, iniciar el dash
        this.player.startDash();
      }
    });
    window.addEventListener("keyup", (e) => {
      const k = e.key.toLowerCase();
      if (keyDirections[k] && k !== "1" && k !== "2") {
        this.del_key(keyDirections[k]);
      }
    });
  }

  // Add a key to the player's keys array if it doesn't already exist
  add_key(direction) {
    if (!this.player.keys.includes(direction)) {
      this.player.keys.push(direction);
    }
  }

  del_key(direction) {
    const i = this.player.keys.indexOf(direction);
    if (i !== -1) this.player.keys.splice(i, 1);
  }
}
