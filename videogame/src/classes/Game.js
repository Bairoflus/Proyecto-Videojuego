// Game.js: Lógica principal del juego
import { Vec } from "./Vec.js";
import { Rect } from "./Rect.js";
import { Player } from "./Player.js";
import { Coin } from "./Coin.js";
import { variables, keyDirections } from "../config.js";
import { boxOverlap } from "../utils.js";
import { FloorGenerator } from "./FloorGenerator.js";
import { Room } from "./Room.js";

export class Game {
  constructor() {
    this.createEventListeners();
    this.floorGenerator = new FloorGenerator();
    this.initObjects();
  }
  // Crea jugador y sala inicial
  initObjects() {
    // Crear sala inicial
    this.currentRoom = new Room(this.floorGenerator.getCurrentRoomLayout());
    
    // Crear jugador en la posición inicial de la sala
    const startPos = this.currentRoom.getPlayerStartPosition();
    this.player = new Player(
      startPos,
      64, 64, "red", 13
    );
    this.player.setSprite("./assets/sprites/dagger-sprite-sheet.png", new Rect(0, 0, 64, 64));
    this.player.setAnimation(130, 130, false, variables.animationDelay);
    this.player.setCurrentRoom(this.currentRoom);
  }
  // Dibuja la sala actual y el jugador
  draw(ctx) {
    this.currentRoom.draw(ctx);
    this.player.draw(ctx);
  }
  // Actualiza la lógica del juego
  update(deltaTime) {
    // Actualizar sala actual
    this.currentRoom.update(deltaTime);

    // Verificar transición de sala
    if (this.currentRoom.isPlayerAtRightEdge(this.player)) {
      if (this.floorGenerator.nextRoom()) {
        const nextLayout = this.floorGenerator.getCurrentRoomLayout();
        if (nextLayout) {
          // Crear nueva sala
          this.currentRoom = new Room(nextLayout);
          // Actualizar referencia de sala en el jugador
          this.player.setCurrentRoom(this.currentRoom);
          // Reposicionar jugador en el lado izquierdo de la nueva sala
          this.player.position = this.currentRoom.getPlayerStartPosition();
          // Asegurar que el jugador no pueda moverse durante la transición
          this.player.velocity = new Vec(0, 0);
          this.player.keys = [];
        }
      }
    }

    // Actualizar jugador
    this.player.update(deltaTime);

    // Verificar colisiones con paredes
    if (this.currentRoom.checkWallCollision(this.player)) {
      // Revertir posición del jugador si colisiona con pared
      this.player.position = this.player.previousPosition;
    }

    // Guardar posición actual para la siguiente actualización
    this.player.previousPosition = new Vec(
      this.player.position.x,
      this.player.position.y
    );
  }
  // Eventos de teclado para movimiento
  createEventListeners() {
    window.addEventListener("keydown", e => { 
      if (keyDirections[e.key]) this.add_key(keyDirections[e.key]); 
    });
    window.addEventListener("keyup", e => { 
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