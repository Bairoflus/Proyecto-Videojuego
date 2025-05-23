// Game.js: Lógica principal del juego
import { Vec } from "./Vec.js";
import { Rect } from "./Rect.js";
import { Player } from "./Player.js";
import { Coin } from "./Coin.js";
import { variables, keyDirections } from "../config.js";
import { boxOverlap } from "../utils.js";
export class Game {
  constructor() {
    this.createEventListeners();
    this.initObjects();
  }
  // Crea jugador, actores y monedas
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
    this.player.setAnimation(130, 130, false, variables.animationDelay);
    this.actors = [];
    this.coins = this.generateCoins(10);
  }
  // Genera monedas con sprite y animación
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
  // Dibuja actores, monedas y jugador
  draw(ctx) {
    this.actors.forEach((actor) => actor.draw(ctx));
    this.coins.forEach((coin) => coin.draw(ctx));
    this.player.draw(ctx);
  }
  // Actualiza actores, filtra monedas recogidas y jugador
  update(deltaTime) {
    this.actors.forEach((actor) => actor.update(deltaTime));
    this.coins = this.coins.filter((coin) => !boxOverlap(this.player, coin));
    this.coins.forEach((coin) => coin.update(deltaTime));
    this.player.update(deltaTime);
  }
  // Eventos de teclado para movimiento
  createEventListeners() {
    window.addEventListener("keydown", (e) => {
      if (keyDirections[e.key]) this.add_key(keyDirections[e.key]);
    });
    window.addEventListener("keyup", (e) => {
      if (keyDirections[e.key]) this.del_key(keyDirections[e.key]);
    });
  }
  // Añade dirección de movimiento
  add_key(direction) {
    if (!this.player.keys.includes(direction)) {
      this.player.keys.push(direction);
    }
  }
  // Elimina dirección de movimiento
  del_key(direction) {
    const i = this.player.keys.indexOf(direction);
    if (i !== -1) this.player.keys.splice(i, 1);
  }
}
