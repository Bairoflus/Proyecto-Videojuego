import { Vec } from "./Vec.js";
import { Rect } from "./Rect.js";
import { Player } from "./Player.js";
import { Coin } from "./Coin.js";
import { variables, keyDirections, playerMovement } from "../config.js";
import { boxOverlap } from "../utils.js";

export class Game {
  constructor() {
    this.createEventListeners();
    this.initObjects();
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
      "./assets/sprites/dagger-sprite-sheet.png",
      new Rect(0, 0, 64, 64)
    );
    this.actors = [];
    this.coins = this.generateCoins(10);
  }

  generateCoins(count) {
    const coins = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * (variables.canvasWidth - 32);
      const y = Math.random() * (variables.canvasHeight - 32);
      const coin = new Coin(new Vec(x, y), 32, 32, "yellow", 8);
      coin.setSprite("./assets/sprites/coin_gold.png", new Rect(0, 0, 32, 32));
      coin.setAnimation(0, 7, true, variables.animationDelay);
      coins.push(coin);
    }
    return coins;
  }

  draw(ctx) {
    this.actors.forEach((actor) => actor.draw(ctx));
    this.coins.forEach((coin) => coin.draw(ctx));
    this.player.draw(ctx);
  }

  update(deltaTime) {
    this.actors.forEach((actor) => actor.update(deltaTime));
    this.coins = this.coins.filter((coin) => !boxOverlap(this.player, coin));
    this.coins.forEach((coin) => coin.update(deltaTime));
    this.player.update(deltaTime);
  }

  createEventListeners() {
    window.addEventListener("keydown", (e) => {
      if (keyDirections[e.key]) {
        if (e.key === "1") {
          this.player.setWeapon("dagger");
          this.player.setSprite(
            "./assets/sprites/dagger-sprite-sheet.png",
            new Rect(0, 0, 64, 64)
          );
          this.player.setMovementAnimation();
        } else if (e.key === "2") {
          this.player.setWeapon("slingshot");
          this.player.setSprite(
            "./assets/sprites/slingshot-sprite-sheet.png",
            new Rect(0, 0, 64, 64)
          );
          this.player.setMovementAnimation();
        } else if (e.key === " ") {
          this.player.attack();
        } else {
          this.add_key(keyDirections[e.key]);
        }
      }
    });
    window.addEventListener("keyup", (e) => {
      if (keyDirections[e.key] && e.key !== "1" && e.key !== "2") {
        this.del_key(keyDirections[e.key]);
      }
    });
  }

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
