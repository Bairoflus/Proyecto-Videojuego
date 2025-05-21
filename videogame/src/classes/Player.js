// Player.js: Jugador controlable con física y animación
import { AnimatedObject } from "./AnimatedObject.js";
import { Vec } from "./Vec.js";
import { variables, playerMovement } from "../config.js";

export class Player extends AnimatedObject {
    constructor(position, width, height, color, sheetCols) {
        super(position, width, height, color, "player", sheetCols);
        this.velocity = new Vec(0, 0);
        this.keys = [];
        this.previousDirection = "down";
        this.currentDirection = "down";
        this.previousPosition = new Vec(position.x, position.y);
        this.showHitbox = true; // Variable para controlar la visibilidad del hitbox
        this.currentRoom = null;
    }

    setCurrentRoom(room) {
        this.currentRoom = room;
    }

    update(deltaTime) {
        // Guardar posición actual antes de actualizar
        this.previousPosition = new Vec(this.position.x, this.position.y);

        this.setVelocity();
        this.setMovementAnimation();
        
        // Intentar movimiento en X
        const newPositionX = this.position.plus(new Vec(this.velocity.x * deltaTime, 0));
        const tempPlayerX = new Player(newPositionX, this.width, this.height, this.color, this.sheetCols);
        
        // Intentar movimiento en Y
        const newPositionY = this.position.plus(new Vec(0, this.velocity.y * deltaTime));
        const tempPlayerY = new Player(newPositionY, this.width, this.height, this.color, this.sheetCols);
        
        // Verificar colisiones por separado
        const canMoveX = !this.currentRoom.checkWallCollision(tempPlayerX);
        const canMoveY = !this.currentRoom.checkWallCollision(tempPlayerY);
        
        // Aplicar movimiento según las colisiones
        if (canMoveX) {
            this.position.x = newPositionX.x;
        }
        if (canMoveY) {
            this.position.y = newPositionY.y;
        }
        
        this.constrainToCanvas();
        this.updateFrame(deltaTime);
    }

    // Evita salida del canvas
    constrainToCanvas() {
        const w = variables.canvasWidth;
        const h = variables.canvasHeight;
        if (this.position.y < 0) this.position.y = 0;
        else if (this.position.y + this.height > h) this.position.y = h - this.height;
        if (this.position.x < 0) this.position.x = 0;
        else if (this.position.x + this.width > w) this.position.x = w - this.width;
    }

    // Calcula velocidad normalizada según teclas presionadas
    setVelocity() {
        this.velocity = new Vec(0, 0);
        for (const key of this.keys) {
            const move = playerMovement[key];
            this.velocity[move.axis] += move.direction;
        }
        this.velocity = this.velocity.normalize().times(variables.playerSpeed);
    }

    // Determina dirección y ajusta animación
    setMovementAnimation() {
        const v = this.velocity;
        this.currentDirection =
            Math.abs(v.y) > Math.abs(v.x)
                ? v.y > 0 ? "down" : v.y < 0 ? "up" : "idle"
                : v.x > 0 ? "right" : v.x < 0 ? "left" : "idle";

        if (this.currentDirection !== this.previousDirection) {
            const anim = playerMovement[this.currentDirection];
            this.setAnimation(...anim.frames, anim.repeat, anim.duration);
            this.frame = this.minFrame;
        }
        this.previousDirection = this.currentDirection;
    }

    // Sobrescribir el método draw para mostrar el hitbox
    draw(ctx) {
        // Primero dibujar el sprite normal
        super.draw(ctx);
        
        // Si showHitbox es true, dibujar el hitbox
        if (this.showHitbox) {
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                this.position.x,
                this.position.y,
                this.width,
                this.height
            );
        }
    }
}