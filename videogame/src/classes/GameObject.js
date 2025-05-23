export class GameObject {
  constructor(position, width, height, color, type) {
    this.position = position;
    this.width = width;
    this.height = height;
    this.color = color;
    this.type = type;
  }

  setSprite(imagePath, rect) {
    this.spriteImage = new Image();
    this.spriteImage.src = imagePath;
    if (rect) this.spriteRect = rect;
  }

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

  update() {}
}
