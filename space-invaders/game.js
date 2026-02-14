// Space Invaders bàsic amb controls tàctils
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;

// Nau
const shipWidth = 50;
const shipHeight = 20;
let shipX = (CANVAS_WIDTH - shipWidth) / 2;
let shipSpeed = 6;

// Controls
let leftPressed = false;
let rightPressed = false;
let shootPressed = false;

// Projectils
let bullets = [];
const bulletWidth = 6;
const bulletHeight = 16;
const bulletSpeed = 8;

// Enemics
const enemyRowCount = 3;
const enemyColCount = 7;
const enemyWidth = 36;
const enemyHeight = 24;
const enemyPadding = 18;
const enemyOffsetTop = 40;
const enemyOffsetLeft = 30;
let enemies = [];
let enemyDirection = 1;
let enemySpeed = 1.2;

function initEnemies() {
	enemies = [];
	for (let r = 0; r < enemyRowCount; r++) {
		for (let c = 0; c < enemyColCount; c++) {
			enemies.push({
				x: enemyOffsetLeft + c * (enemyWidth + enemyPadding),
				y: enemyOffsetTop + r * (enemyHeight + enemyPadding),
				alive: true
			});
		}
	}
}
initEnemies();


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
		shipX += dx;
		lastX = e.touches[0].clientX;
		if (shipX < 0) shipX = 0;
		if (shipX > CANVAS_WIDTH - shipWidth) shipX = CANVAS_WIDTH - shipWidth;
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
		shipX += dx;
		lastX = e.clientX;
		if (shipX < 0) shipX = 0;
		if (shipX > CANVAS_WIDTH - shipWidth) shipX = CANVAS_WIDTH - shipWidth;
	}
});
canvas.addEventListener('mouseup', e => {
	dragging = false;
});
canvas.addEventListener('mouseleave', e => {
	dragging = false;
});

// Controls teclat (opcional)
document.addEventListener('keydown', e => {
	if (e.key === 'ArrowLeft') leftPressed = true;
	if (e.key === 'ArrowRight') rightPressed = true;
	if (e.key === ' ' || e.key === 'Spacebar') shootPressed = true;
});
document.addEventListener('keyup', e => {
	if (e.key === 'ArrowLeft') leftPressed = false;
	if (e.key === 'ArrowRight') rightPressed = false;
	if (e.key === ' ' || e.key === 'Spacebar') shootPressed = false;
});

function drawShip() {
	ctx.fillStyle = '#0ff';
	ctx.fillRect(shipX, CANVAS_HEIGHT - shipHeight - 10, shipWidth, shipHeight);
}

function drawBullets() {
	ctx.fillStyle = '#fff';
	bullets.forEach(b => ctx.fillRect(b.x, b.y, bulletWidth, bulletHeight));
}

function drawEnemies() {
	ctx.fillStyle = '#f39c12';
	enemies.forEach(e => {
		if (e.alive) ctx.fillRect(e.x, e.y, enemyWidth, enemyHeight);
	});
}

function moveEnemies() {
	let hitEdge = false;
	enemies.forEach(e => {
		if (!e.alive) return;
		e.x += enemySpeed * enemyDirection;
		if (e.x <= 0 || e.x + enemyWidth >= CANVAS_WIDTH) hitEdge = true;
	});
	if (hitEdge) {
		enemyDirection *= -1;
		enemies.forEach(e => { e.y += enemyHeight / 2; });
	}
}

function updateBullets() {
	bullets.forEach(b => b.y -= bulletSpeed);
	// Elimina bales fora de pantalla
	bullets = bullets.filter(b => b.y + bulletHeight > 0);
}

function shoot() {
	if (bullets.length < 2) { // màxim 2 bales simultànies
		bullets.push({ x: shipX + shipWidth/2 - bulletWidth/2, y: CANVAS_HEIGHT - shipHeight - 18 });
	}
}

function collisionDetection() {
	bullets.forEach(b => {
		enemies.forEach(e => {
			if (e.alive && b.x < e.x + enemyWidth && b.x + bulletWidth > e.x && b.y < e.y + enemyHeight && b.y + bulletHeight > e.y) {
				e.alive = false;
				b.y = -100; // elimina bala
			}
		});
	});
}

function draw() {
	ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
	drawEnemies();
	drawShip();
	drawBullets();
}

function update() {
	if (leftPressed && shipX > 0) shipX -= shipSpeed;
	if (rightPressed && shipX < CANVAS_WIDTH - shipWidth) shipX += shipSpeed;
	if (shootPressed) {
		shoot();
		shootPressed = false;
	}
	moveEnemies();
	updateBullets();
	collisionDetection();
}

function gameLoop() {
	draw();
	update();
	requestAnimationFrame(gameLoop);
}

gameLoop();

function resizeCanvas() {
  canvas.width = Math.min(window.innerWidth, 480);
  canvas.height = Math.min(window.innerHeight * 0.7, 640);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
