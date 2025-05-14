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

  setOldTime(newTime);
  requestAnimationFrame(drawScene);
}
