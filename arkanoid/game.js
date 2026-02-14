// Arkanoid per a mòbil - Controls tàctils
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Dimensions adaptades a mòbil
const CANVAS_WIDTH = Math.min(window.innerWidth, 480);
const CANVAS_HEIGHT = Math.min(window.innerHeight * 0.7, 700);
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Joc: variables bàsiques
let paddleWidth = CANVAS_WIDTH * 0.25;
let paddleHeight = 16;
let paddleX = (CANVAS_WIDTH - paddleWidth) / 2;
let paddleSpeed = CANVAS_WIDTH * 0.012;

let ballRadius = 10;
let ballX = CANVAS_WIDTH / 2;
let ballY = CANVAS_HEIGHT - 60;
let ballDX = CANVAS_WIDTH * 0.005;
let ballDY = -CANVAS_HEIGHT * 0.012;

let rightPressed = false;
let leftPressed = false;

// Maons
const brickRowCount = 5;
const brickColumnCount = 7;
const brickWidth = (CANVAS_WIDTH - 80) / brickColumnCount;
const brickHeight = 24;
const brickPadding = 8;
const brickOffsetTop = 40;
const brickOffsetLeft = 40;
let bricks = [];

function initBricks() {
  bricks = [];
  for(let c=0; c<brickColumnCount; c++) {
    bricks[c] = [];
    for(let r=0; r<brickRowCount; r++) {
      bricks[c][r] = { x: 0, y: 0, status: 1 };
    }
  }
}

initBricks();

// Controls drag minimalista
let dragging = false;
let lastX = null;

canvas.addEventListener('touchstart', e => {
  if (e.touches.length === 1) {
    dragging = true;
    lastX = e.touches[0].clientX;
  }
});
canvas.addEventListener('touchmove', e => {
  if (dragging && e.touches.length === 1) {
    const dx = e.touches[0].clientX - lastX;
    paddleX += dx;
    lastX = e.touches[0].clientX;
    if (paddleX < 0) paddleX = 0;
    if (paddleX > CANVAS_WIDTH - paddleWidth) paddleX = CANVAS_WIDTH - paddleWidth;
  }
});
canvas.addEventListener('touchend', e => {
  dragging = false;
});
canvas.addEventListener('mousedown', e => {
  dragging = true;
  lastX = e.clientX;
});
canvas.addEventListener('mousemove', e => {
  if (dragging) {
    const dx = e.clientX - lastX;
    paddleX += dx;
    lastX = e.clientX;
    if (paddleX < 0) paddleX = 0;
    if (paddleX > CANVAS_WIDTH - paddleWidth) paddleX = CANVAS_WIDTH - paddleWidth;
  }
});
canvas.addEventListener('mouseup', e => {
  dragging = false;
});
canvas.addEventListener('mouseleave', e => {
  dragging = false;
});

// Controls per teclat (opcional)
document.addEventListener('keydown', e => {
  if(e.key === 'ArrowRight') rightPressed = true;
  else if(e.key === 'ArrowLeft') leftPressed = true;
});
document.addEventListener('keyup', e => {
  if(e.key === 'ArrowRight') rightPressed = false;
  else if(e.key === 'ArrowLeft') leftPressed = false;
});

// Dibuixa maons
function drawBricks() {
  for(let c=0; c<brickColumnCount; c++) {
    for(let r=0; r<brickRowCount; r++) {
      if(bricks[c][r].status === 1) {
        let brickX = c*(brickWidth+brickPadding) + brickOffsetLeft;
        let brickY = r*(brickHeight+brickPadding) + brickOffsetTop;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;
        ctx.beginPath();
        ctx.rect(brickX, brickY, brickWidth, brickHeight);
        ctx.fillStyle = '#f39c12';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(brickX, brickY, brickWidth, brickHeight);
        ctx.closePath();
      }
    }
  }
}

// Dibuixa la pala
function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, CANVAS_HEIGHT - paddleHeight - 10, paddleWidth, paddleHeight);
  ctx.fillStyle = '#3498db';
  ctx.fill();
  ctx.closePath();
}

// Dibuixa la pilota
function drawBall() {
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballRadius, 0, Math.PI*2);
  ctx.fillStyle = '#e74c3c';
  ctx.fill();
  ctx.closePath();
}

// Col·lisions amb maons
function collisionDetection() {
  for(let c=0; c<brickColumnCount; c++) {
    for(let r=0; r<brickRowCount; r++) {
      let b = bricks[c][r];
      if(b.status === 1) {
        if(ballX > b.x && ballX < b.x+brickWidth && ballY > b.y && ballY < b.y+brickHeight) {
          ballDY = -ballDY;
          b.status = 0;
        }
      }
    }
  }
}

// Dibuixa tot
function draw() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawBricks();
  drawPaddle();
  drawBall();
}

// Actualitza estat del joc
function update() {
  if(rightPressed && paddleX < CANVAS_WIDTH - paddleWidth) {
    paddleX += paddleSpeed;
  } else if(leftPressed && paddleX > 0) {
    paddleX -= paddleSpeed;
  }

  ballX += ballDX;
  ballY += ballDY;

  // Col·lisions amb parets
  if(ballX + ballRadius > CANVAS_WIDTH || ballX - ballRadius < 0) {
    ballDX = -ballDX;
  }
  if(ballY - ballRadius < 0) {
    ballDY = -ballDY;
  } else if(ballY + ballRadius > CANVAS_HEIGHT - paddleHeight - 10) {
    if(ballX > paddleX && ballX < paddleX + paddleWidth) {
      ballDY = -ballDY;
      // Efecte segons on toca la pala
      let hit = (ballX - (paddleX + paddleWidth/2)) / (paddleWidth/2);
      ballDX += hit * 0.7;
    } else if(ballY + ballRadius > CANVAS_HEIGHT) {
      // Game over
      document.location.reload();
    }
  }

  collisionDetection();
}

function gameLoop() {
  draw();
  update();
  requestAnimationFrame(gameLoop);
}

gameLoop();

// Redimensiona el canvas si canvia la mida de la finestra
function resizeCanvas() {
  const w = Math.min(window.innerWidth, 480);
  const h = Math.min(window.innerHeight * 0.7, 700);
  canvas.width = w;
  canvas.height = h;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
