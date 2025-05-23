import { variables } from "./config.js";
import { Vec } from "./classes/Vec.js";

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
  ctx.lineWidth = 2;
  ctx.strokeRect(obj.position.x, obj.position.y, obj.width, obj.height);

  // Draw center point
  ctx.fillStyle = color;
  ctx.fillRect(obj.position.x - 2, obj.position.y - 2, 4, 4);
  ctx.restore();
}

function drawHitboxes(ctx, game) {
  // Draw player hitbox (cyan)
  drawHitbox(ctx, game.player, "#00ffff");

  // Draw enemy hitboxes (yellow)
  game.enemies.forEach((enemy) => {
    drawHitbox(ctx, enemy, "#ffff00");
  });

  // Draw attack range circle when attacking (blue)
  if (game.player.isAttacking && game.player.weaponType === "dagger") {
    ctx.save();
    ctx.strokeStyle = "#0000ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Draw circle with radius 50 (matches attackRange in Player.js)
    ctx.arc(
      game.player.position.x + game.player.width / 2,
      game.player.position.y + game.player.height / 2,
      50,
      0,
      Math.PI * 2
    );
    ctx.stroke();
    ctx.restore();
  }
}

export function boxOverlap(obj1, obj2) {
  return (
    obj1.position.x + obj1.width > obj2.position.x &&
    obj1.position.x < obj2.position.x + obj2.width &&
    obj1.position.y + obj1.height > obj2.position.y &&
    obj1.position.y < obj2.position.y + obj2.height
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
