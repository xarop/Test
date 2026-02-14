// Tetris minimalista, controls drag lateral per moure la peça
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const COLS = 10, ROWS = 20, SIZE = 24;
canvas.width = COLS * SIZE;
canvas.height = ROWS * SIZE;
const COLORS = ['#fff','#0ff','#f39c12','#e74c3c','#3498db','#2ecc71','#9b59b6','#95a5a6'];
const SHAPES = [
  [],
  [[1,1,1,1]], // I
  [[1,1],[1,1]], // O
  [[0,1,0],[1,1,1]], // T
  [[1,1,0],[0,1,1]], // S
  [[0,1,1],[1,1,0]], // Z
  [[1,0,0],[1,1,1]], // J
  [[0,0,1],[1,1,1]]  // L
];
let board = Array.from({length:ROWS},()=>Array(COLS).fill(0));
let cur = {x:3,y:0,shape:SHAPES[1],color:1};
let next = {x:3,y:0,shape:SHAPES[2],color:2};
let dragging = false, lastX = null;
function randomPiece(){
  let t = 1+Math.floor(Math.random()*7);
  return {x:3,y:0,shape:SHAPES[t],color:t};
}
function collide(p){
  for(let y=0;y<p.shape.length;y++)
    for(let x=0;x<p.shape[y].length;x++)
      if(p.shape[y][x]&&
        (board[p.y+y]&&board[p.y+y][p.x+x])!==0||p.x+x<0||p.x+x>=COLS||p.y+y>=ROWS)
        return true;
  return false;
}
function merge(p){
  for(let y=0;y<p.shape.length;y++)
    for(let x=0;x<p.shape[y].length;x++)
      if(p.shape[y][x]) board[p.y+y][p.x+x]=p.color;
}
function rotate(p){
  let s=p.shape.map((r,i)=>p.shape.map(c=>c[i])).reverse();
  return {...p,shape:s};
}
canvas.addEventListener('touchstart',e=>{if(e.touches.length===1){dragging=true;lastX=e.touches[0].clientX;}});
canvas.addEventListener('touchmove',e=>{if(dragging&&e.touches.length===1){const dx=e.touches[0].clientX-lastX;if(dx>10){cur.x++;if(collide(cur))cur.x--;lastX=e.touches[0].clientX;}else if(dx<-10){cur.x--;if(collide(cur))cur.x++;lastX=e.touches[0].clientX;}}});
canvas.addEventListener('touchend',()=>dragging=false);
canvas.addEventListener('mousedown',e=>{dragging=true;lastX=e.clientX;});
canvas.addEventListener('mousemove',e=>{if(dragging){const dx=e.clientX-lastX;if(dx>10){cur.x++;if(collide(cur))cur.x--;lastX=e.clientX;}else if(dx<-10){cur.x--;if(collide(cur))cur.x++;lastX=e.clientX;}}});
canvas.addEventListener('mouseup',()=>dragging=false);
canvas.addEventListener('mouseleave',()=>dragging=false);
document.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){cur.x--;if(collide(cur))cur.x++;}if(e.key==='ArrowRight'){cur.x++;if(collide(cur))cur.x--;}if(e.key==='ArrowUp'){let r=rotate(cur);if(!collide(r))cur.shape=r.shape;}});
function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(board[y][x]){ctx.fillStyle=COLORS[board[y][x]];ctx.fillRect(x*SIZE,y*SIZE,SIZE,SIZE);}for(let y=0;y<cur.shape.length;y++)for(let x=0;x<cur.shape[y].length;x++)if(cur.shape[y][x]){ctx.fillStyle=COLORS[cur.color];ctx.fillRect((cur.x+x)*SIZE,(cur.y+y)*SIZE,SIZE,SIZE);}}
function drop(){cur.y++;if(collide(cur)){cur.y--;merge(cur);cur=next;next=randomPiece();if(collide(cur)){board=Array.from({length:ROWS},()=>Array(COLS).fill(0));}}}
function clearLines(){for(let y=ROWS-1;y>=0;y--){if(board[y].every(v=>v)){board.splice(y,1);board.unshift(Array(COLS).fill(0));y++;}}}
let last=0,interval=500;
function loop(ts){if(ts-last>interval){drop();clearLines();last=ts;}draw();requestAnimationFrame(loop);}
loop();
