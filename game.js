const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const laneCount = 3;
let laneWidth = canvas.width / laneCount;
const playerSize = 50;
const obstacleSize = 50;
const obstacleSpeed = 5;
const jumpHeight = 150;
const gravity = 5;
const jumpSpeed = 15;
let lives = 3;
let distance = 0;

let playerX, playerY, playerLane;
let obstacleList = [];
let jump = false;
let jumpVelocity = 0;
let moveLeft = false;
let moveRight = false;
let onGround = true;
let lastObstacleLane = -1;

const colors = {
    background: "#000",
    player: "rgb(0, 128, 255)",
    obstacle: "rgb(255, 0, 0)",
    lane: ["#C8C8C8", "#969696", "#C8C8C8"],
    text: "white",
};

document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") moveLeft = true;
    if (e.key === "ArrowRight") moveRight = true;
    if (e.key === " " && onGround) {
        jump = true;
        jumpVelocity = -jumpSpeed;
        onGround = false;
    }
});

document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") moveLeft = false;
    if (e.key === "ArrowRight") moveRight = false;
});

canvas.addEventListener('touchstart', function(e) {
    const touchX = e.changedTouches[0].clientX;
    if (touchX < canvas.width / 2) {
        moveLeft = true;
    } else {
        moveRight = true;
    }
});

canvas.addEventListener('touchend', function() {
    moveLeft = false;
    moveRight = false;
});

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    laneWidth = canvas.width / laneCount;
    playerX = playerLane * laneWidth + (laneWidth - playerSize) / 2;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();  // 初期ロード時にも呼び出し

function startGame() {
    document.getElementById("menu").style.display = "none";
    document.getElementById("game-over").style.display = "none";
    playerLane = Math.floor(laneCount / 2);
    playerX = playerLane * laneWidth + (laneWidth - playerSize) / 2;
    playerY = canvas.height - 2 * playerSize;
    obstacleList = [];
    lives = 3;
    distance = 0;
    gameLoop();
}

function drawPlayer(x, y) {
    ctx.fillStyle = colors.player;
    ctx.fillRect(x, y, playerSize, playerSize);
}

function drawObstacles(obstacles) {
    ctx.fillStyle = colors.obstacle;
    obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle[0], obstacle[1], obstacleSize, obstacleSize);
    });
}

function createObstacle(lastLane) {
    const availableLanes = Array.from({ length: laneCount }, (_, i) => i).filter(i => i !== lastLane);
    const lane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
    const xPos = lane * laneWidth + (laneWidth - obstacleSize) / 2;
    return [xPos, 0, lane];
}

function drawLanes() {
    for (let i = 0; i < laneCount; i++) {
        ctx.fillStyle = colors.lane[i];
        ctx.fillRect(i * laneWidth, 0, laneWidth, canvas.height);
    }
}

function drawText(text, x, y) {
    ctx.fillStyle = colors.text;
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.fillText(text, x, y);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawLanes();

    if (moveLeft && playerLane > 0) {
        playerLane--;
        playerX = playerLane * laneWidth + (laneWidth - playerSize) / 2;
        moveLeft = false;
    }

    if (moveRight && playerLane < laneCount - 1) {
        playerLane++;
        playerX = playerLane * laneWidth + (laneWidth - playerSize) / 2;
        moveRight = false;
    }

    if (jump) {
        playerY += jumpVelocity;
        jumpVelocity += gravity;
        if (playerY >= canvas.height - 2 * playerSize) {
            playerY = canvas.height - 2 * playerSize;
            jump = false;
            onGround = true;
        }
    }

    if (Math.random() < 0.02) {
        obstacleList.push(createObstacle(lastObstacleLane));
    }

    obstacleList.forEach(obstacle => obstacle[1] += obstacleSpeed);

    obstacleList = obstacleList.filter(obstacle => obstacle[1] < canvas.height);

    obstacleList.forEach(obstacle => {
        if (playerY < obstacle[1] + obstacleSize &&
            playerY + playerSize > obstacle[1] &&
            playerLane === obstacle[2]) {
            lives--;
            obstacleList.splice(obstacleList.indexOf(obstacle), 1);
        }
    });

    if (lives <= 0) {
        document.getElementById("final-distance").textContent = `Distance: ${distance}`;
        document.getElementById("game-over").style.display = "block";
        return;
    }

    distance++;

    drawPlayer(playerX, playerY);
    drawObstacles(obstacleList);
    drawText(`Distance: ${distance}`, 150, 50);
    drawText(`Lives: ${lives}`, 650, 50);

    requestAnimationFrame(gameLoop);
}
