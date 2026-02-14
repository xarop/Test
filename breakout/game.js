// Breakout minimalista, controls drag
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const paddleW = 80, paddleH = 12;
let paddleX = (W - paddleW) / 2;
let ballX = W/2, ballY = H-60, ballDX = 4, ballDY = -4, ballR = 8;
const brickRow = 5, brickCol = 7, brickW = 56, brickH = 18, brickPad = 8, brickOffT = 40, brickOffL = 16;
let bricks = [];
for(let c=0;c<brickCol;c++){
  bricks[c]=[];
  for(let r=0;r<brickRow;r++)
    bricks[c][r]={x:0,y:0,alive:true};
}
let dragging = false, lastX = null;
canvas.addEventListener('touchstart', e => {if(e.touches.length===1){dragging=true;lastX=e.touches[0].clientX;}});
canvas.addEventListener('touchmove', e => {if(dragging&&e.touches.length===1){const dx=e.touches[0].clientX-lastX;paddleX+=dx;lastX=e.touches[0].clientX;if(paddleX<0)paddleX=0;if(paddleX>W-paddleW)paddleX=W-paddleW;}});
canvas.addEventListener('touchend',()=>dragging=false);
canvas.addEventListener('mousedown',e=>{dragging=true;lastX=e.clientX;});
canvas.addEventListener('mousemove',e=>{if(dragging){const dx=e.clientX-lastX;paddleX+=dx;lastX=e.clientX;if(paddleX<0)paddleX=0;if(paddleX>W-paddleW)paddleX=W-paddleW;}});
canvas.addEventListener('mouseup',()=>dragging=false);
canvas.addEventListener('mouseleave',()=>dragging=false);
function draw(){ctx.clearRect(0,0,W,H);ctx.fillStyle='#fff';ctx.fillRect(paddleX,H-30,paddleW,paddleH);ctx.beginPath();ctx.arc(ballX,ballY,ballR,0,Math.PI*2);ctx.fill();for(let c=0;c<brickCol;c++)for(let r=0;r<brickRow;r++){if(bricks[c][r].alive){let bx=c*(brickW+brickPad)+brickOffL,by=r*(brickH+brickPad)+brickOffT;bricks[c][r].x=bx;bricks[c][r].y=by;ctx.fillRect(bx,by,brickW,brickH);}}}
function update(){ballX+=ballDX;ballY+=ballDY;if(ballX-ballR<0||ballX+ballR>W)ballDX=-ballDX;if(ballY-ballR<0)ballDY=-ballDY;if(ballY+ballR>H-30&&ballX>paddleX&&ballX<paddleX+paddleW)ballDY=-ballDY;if(ballY+ballR>H){ballX=W/2;ballY=H-60;ballDX=4;ballDY=-4;}for(let c=0;c<brickCol;c++)for(let r=0;r<brickRow;r++){let b=bricks[c][r];if(b.alive&&ballX>b.x&&ballX<b.x+brickW&&ballY>b.y&&ballY<b.y+brickH){ballDY=-ballDY;b.alive=false;}}}
function loop(){draw();update();requestAnimationFrame(loop);}loop();

function resizeCanvas() {
  canvas.width = Math.min(window.innerWidth, 480);
  canvas.height = Math.min(window.innerHeight * 0.7, 640);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();