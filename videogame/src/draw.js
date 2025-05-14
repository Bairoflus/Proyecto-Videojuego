import { variables } from "./config.js";

export function getCtx() {
  return variables.ctx;
}
export function setCtx(value) {
  variables.ctx = value;
}
export function getGame() {
  return variables.game;
}
export function setGame(value) {
  variables.game = value;
}
export function getOldTime() {
  return variables.oldTime;
}
export function setOldTime(value) {
  variables.oldTime = value;
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
  const ctx = getCtx();
  const game = getGame();
  let oldTime = getOldTime();

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
