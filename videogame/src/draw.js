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
  ctx.fillStyle = `${color}20`; // Add semi-transparent fill
  ctx.lineWidth = 2;

  // Draw hitbox using full sprite size
  ctx.beginPath();
  ctx.rect(obj.position.x, obj.position.y, obj.width, obj.height);
  ctx.fill();
  ctx.stroke();

  // Draw center point
  ctx.fillStyle = color;
  const centerX = obj.position.x + obj.width / 2;
  const centerY = obj.position.y + obj.height / 2;
  ctx.fillRect(centerX - 2, centerY - 2, 4, 4);
  ctx.restore();
}

function drawHitboxes(ctx, game) {
  // Draw player hitbox (cyan)
  drawHitbox(ctx, game.player, "#00ffff");

  // Draw enemy hitboxes (yellow)
  game.enemies.forEach((enemy) => {
    drawHitbox(ctx, enemy, "#ffff00");
  });

  // Draw attack area when attacking with dagger (blue)
  if (game.player.isAttacking && game.player.weaponType === "dagger") {
    ctx.save();
    ctx.strokeStyle = "#0000ff";
    ctx.fillStyle = "rgba(0, 0, 255, 0.2)";
    ctx.lineWidth = 2;
    ctx.beginPath();

    const centerX = game.player.position.x + game.player.width / 2;
    const centerY = game.player.position.y + game.player.height / 2;
    const attackRange = 50; // Same as in Player.js
    const attackWidth = 40; // Same as in Player.js

    // Define attack area based on direction
    let attackArea = {
      x: centerX,
      y: centerY,
      width: attackRange,
      height: attackWidth,
    };

    // Position attack area based on direction - matches Player.js attack logic exactly
    switch (game.player.currentDirection) {
      case "right":
        attackArea.x = centerX;
        attackArea.y = centerY - attackWidth / 2;
        break;
      case "left":
        attackArea.x = centerX - attackRange;
        attackArea.y = centerY - attackWidth / 2;
        break;
      case "up":
        attackArea.width = attackWidth;
        attackArea.height = attackRange;
        attackArea.x = centerX - attackWidth / 2;
        attackArea.y = centerY - attackRange;
        break;
      case "down":
        attackArea.width = attackWidth;
        attackArea.height = attackRange;
        attackArea.x = centerX - attackWidth / 2;
        attackArea.y = centerY;
        break;
    }

    ctx.rect(attackArea.x, attackArea.y, attackArea.width, attackArea.height);
    ctx.fill();
    ctx.stroke();

    // Draw center point of attack area
    ctx.fillStyle = "#0000ff";
    const attackCenterX = attackArea.x + attackArea.width / 2;
    const attackCenterY = attackArea.y + attackArea.height / 2;
    ctx.fillRect(attackCenterX - 2, attackCenterY - 2, 4, 4);

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
