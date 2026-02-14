// Pong minimalista, controls drag
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const paddleW = 80, paddleH = 12;
let playerY = H - 30, aiY = 18;
let playerX = (W - paddleW) / 2, aiX = (W - paddleW) / 2;
let ballX = W/2, ballY = H/2, ballDX = 4, ballDY = 4, ballR = 8;
let dragging = false, lastX = null;

canvas.addEventListener('touchstart', e => {
  if (e.touches.length === 1) {
    dragging = true;
    lastX = e.touches[0].clientX;
  }
});
canvas.addEventListener('touchmove', e => {
  if (dragging && e.touches.length === 1) {
    const dx = e.touches[0].clientX - lastX;
    playerX += dx;
    lastX = e.touches[0].clientX;
    if (playerX < 0) playerX = 0;
    if (playerX > W - paddleW) playerX = W - paddleW;
  }
});
canvas.addEventListener('touchend', () => dragging = false);
canvas.addEventListener('mousedown', e => { dragging = true; lastX = e.clientX; });
canvas.addEventListener('mousemove', e => {
  if (dragging) {
    const dx = e.clientX - lastX;
    playerX += dx;
    lastX = e.clientX;
    if (playerX < 0) playerX = 0;
    if (playerX > W - paddleW) playerX = W - paddleW;
  }
});
canvas.addEventListener('mouseup', () => dragging = false);
canvas.addEventListener('mouseleave', () => dragging = false);

function draw() {
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = '#fff';
  ctx.fillRect(playerX, playerY, paddleW, paddleH);
  ctx.fillRect(aiX, aiY, paddleW, paddleH);
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballR, 0, Math.PI*2);
  ctx.fill();
}

function update() {
  // AI segueix la pilota
  if (ballX < aiX + paddleW/2) aiX -= 3;
  else if (ballX > aiX + paddleW/2) aiX += 3;
  if (aiX < 0) aiX = 0;
  if (aiX > W - paddleW) aiX = W - paddleW;

  ballX += ballDX;
  ballY += ballDY;

  // Rebot parets
  if (ballX - ballR < 0 || ballX + ballR > W) ballDX = -ballDX;
  // Rebot pala jugador
  if (ballY + ballR > playerY && ballX > playerX && ballX < playerX + paddleW) ballDY = -ballDY;
  // Rebot pala AI
  if (ballY - ballR < aiY + paddleH && ballX > aiX && ballX < aiX + paddleW) ballDY = -ballDY;
  // Puntua
  if (ballY - ballR < 0 || ballY + ballR > H) {
    ballX = W/2; ballY = H/2; ballDX = 4 * (Math.random() > 0.5 ? 1 : -1); ballDY = 4 * (Math.random() > 0.5 ? 1 : -1);
  }
}

function loop() {
  draw();
  update();
  requestAnimationFrame(loop);
}
loop();

function resizeCanvas() {
  canvas.width = Math.min(window.innerWidth, 480);
  canvas.height = Math.min(window.innerHeight * 0.7, 640);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
