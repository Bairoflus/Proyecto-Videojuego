// AnimatedObject.js: Extiende GameObject para soportar animaciones basadas en una spritesheet
import { GameObject } from "./GameObject.js";

export class AnimatedObject extends GameObject {
  constructor(position, width, height, color, type, sheetCols) {
    // Llamada al constructor padre con posición, tamaño, color y tipo
    super(position, width, height, color, type);
    this.frame = 0;             // Frame actual de la animación
    this.minFrame = 0;          // Frame inicial del rango de animación
    this.maxFrame = 0;          // Frame final del rango de animación
    this.sheetCols = sheetCols; // Número de columnas en la hoja de sprites
    this.repeat = true;         // Indica si la animación debe reiniciarse al finalizar
    this.frameDuration = 100;   // Duración (ms) de cada frame
    this.totalTime = 0;         // Tiempo acumulado desde el último cambio de frame
  }

  // Configura los parámetros de la animación: rango de frames, repetición y duración
  setAnimation(minFrame, maxFrame, repeat, duration) {
    this.minFrame = minFrame;
    this.maxFrame = maxFrame;
    this.frame = minFrame;
    this.repeat = repeat;
    this.totalTime = 0;
    this.frameDuration = duration;
  }

  // Actualiza el frame según el deltaTime y reinicia o avanza la animación
  updateFrame(deltaTime) {
    this.totalTime += deltaTime;
    if (this.totalTime > this.frameDuration) {
      // Calcula si debe reiniciar o quedarse en el último frame
      let restart = this.repeat ? this.minFrame : this.frame;
      this.frame = this.frame < this.maxFrame ? this.frame + 1 : restart;
      // Calcula la posición (x,y) en la hoja de sprites
      this.spriteRect.x = this.frame % this.sheetCols;
      this.spriteRect.y = Math.floor(this.frame / this.sheetCols);
      this.totalTime = 0;
    }
  }
}