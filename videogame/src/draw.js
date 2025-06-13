import { variables } from "./config.js";

let ctx = null;
let game = null;
let oldTime = null;

export function getCtx() {
  return ctx;
}
export function setCtx(value) {
  ctx = value;
}
export function getGame() {
  return game;
}
export function setGame(value) {
  game = value;
}
export function getOldTime() {
  return oldTime;
}
export function setOldTime(value) {
  oldTime = value;
}

function drawHitbox(ctx, obj, color = "black") {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = `${color}20`; // Add semi-transparent fill
  ctx.lineWidth = 2;

  // Get actual hitbox bounds
  const hitbox = obj.getHitboxBounds();

  // Draw hitbox
  ctx.beginPath();
  ctx.rect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
  ctx.fill();
  ctx.stroke();

  // Draw center point of hitbox
  ctx.fillStyle = color;
  const centerX = hitbox.x + hitbox.width / 2;
  const centerY = hitbox.y + hitbox.height / 2;
  ctx.fillRect(centerX - 2, centerY - 2, 4, 4);
  ctx.restore();
}

function drawHitboxes(ctx, game) {
  // Draw player hitbox (cyan) if player exists
  if (game.player) {
    drawHitbox(ctx, game.player, "#00ffff");
  }

  // Draw enemy hitboxes (yellow) if enemies array exists
  if (game.enemies && Array.isArray(game.enemies)) {
    game.enemies.forEach((enemy) => {
      drawHitbox(ctx, enemy, "#ffff00");
    });
  }

  // Attack range visualization moved to Player.draw() method
}

export function boxOverlap(obj1, obj2) {
  const box1 = obj1.getHitboxBounds();
  const box2 = obj2.getHitboxBounds();
  return (
    box1.x + box1.width > box2.x &&
    box1.x < box2.x + box2.width &&
    box1.y + box1.height > box2.y &&
    box1.y < box2.y + box2.height
  );
}

export function drawScene(newTime) {
  if (oldTime == undefined) oldTime = newTime;
  const deltaTime = newTime - oldTime;

  ctx.drawImage(
    variables.backgroundImage,
    0,
    0,
    variables.canvasWidth,
    variables.canvasHeight
  );

  game.draw(ctx);
  game.update(deltaTime);

  // Draw hitboxes on top
  drawHitboxes(ctx, game);

  setOldTime(newTime);
  requestAnimationFrame(drawScene);
}
