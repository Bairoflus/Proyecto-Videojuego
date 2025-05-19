// GameObject.js: Clase base para objetos del juego
export class GameObject {
  constructor(position, width, height, color, type) {
    this.position = position;
    this.width = width;
    this.height = height;
    this.color = color;
    this.type = type;
  }
  // Asigna imagen y rect de sprite
  setSprite(imagePath, rect) {
    this.spriteImage = new Image();
    this.spriteImage.src = imagePath;
    if (rect) this.spriteRect = rect;
  }
  // Dibuja sprite o rect sólido
  draw(ctx) {
    if (this.spriteImage) {
      if (this.spriteRect) {
        ctx.drawImage(
          this.spriteImage,
          this.spriteRect.x * this.spriteRect.width,
          this.spriteRect.y * this.spriteRect.height,
          this.spriteRect.width,
          this.spriteRect.height,
          this.position.x,
          this.position.y,
          this.width,
          this.height
        );
      } else {
        ctx.drawImage(
          this.spriteImage,
          this.position.x,
          this.position.y,
          this.width,
          this.height
        );
      }
    } else {
      ctx.fillStyle = this.color;
      ctx.fillRect(
        this.position.x,
        this.position.y,
        this.width,
        this.height
      );
    }
  }
  // Placeholder para lógica de actualización
  update() { }
}