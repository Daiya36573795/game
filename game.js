const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const laneCount = 3;
let laneWidth;
const playerSize = 50;
const obstacleSize = 50;
let obstacleSpeed = 5; // 初期速度
const initialObstacleSpeed = 5;
const speedIncreaseInterval = 1000; // 1000メートル（フレーム数）
const speedIncreaseAmount = 1; // 速度の増加量
const jumpHeight = 150;
const gravity = 5;
const jumpSpeed = 15;
let lives = 3;
let distance = 0;

let playerX, playerY, playerLane;
let obstacleList = [];
let jump = false;
let jumpVelocity = 0;
let moveDirection = 0; // -1: left, 0: no movement, 1: right
let onGround = true;
let lastObstacleLane = -1;
let lastObstacleTime = 0;
const minObstacleInterval = 60; // フレーム数（約1秒）

const colors = {
    text: "white",
};

const backgroundImage = new Image();
backgroundImage.src = 'images/sky3.webp'; // 正しいパスを指定

const playerImage = new Image();
playerImage.src = 'images/player.png'; // プレイヤー画像のパスを指定

const enemyImage = new Image();
enemyImage.src = 'images/enemy.png'; // 敵画像のパスを指定

backgroundImage.onload = () => {
    console.log("Background image loaded successfully.");
    resizeCanvas();
    document.getElementById("menu").style.display = "block";
};

backgroundImage.onerror = () => {
    console.error("Failed to load background image.");
};

document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" && moveDirection === 0) moveDirection = -1;
    if (e.key === "ArrowRight" && moveDirection === 0) moveDirection = 1;
    if (e.key === " " && onGround) {
        jump = true;
        jumpVelocity = -jumpSpeed;
        onGround = false;
    }
});

canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    const touchX = e.touches[0].clientX - canvas.offsetLeft;
    if (touchX < canvas.width / 3) {
        moveDirection = -1;
    } else if (touchX > canvas.width * 2 / 3) {
        moveDirection = 1;
    } else {
        if (onGround) {
            jump = true;
            jumpVelocity = -jumpSpeed;
            onGround = false;
        }
    }
});

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    laneWidth = canvas.width / laneCount;
    playerY = canvas.height - 2 * playerSize;
    if (playerLane !== undefined) {
        playerX = playerLane * laneWidth + (laneWidth - playerSize) / 2;
    }
    drawBackground(); // リサイズ時に背景を再描画
}

window.addEventListener('resize', resizeCanvas);

function startGame() {
    document.getElementById("menu").style.display = "none";
    document.getElementById("game-over").style.display = "none";
    playerLane = Math.floor(laneCount / 2);
    playerX = playerLane * laneWidth + (laneWidth - playerSize) / 2;
    playerY = canvas.height - 2 * playerSize;
    obstacleList = [];
    lives = 3;
    distance = 0;
    obstacleSpeed = initialObstacleSpeed; // 敵の速度を初期化
    moveDirection = 0;
    lastObstacleTime = 0; // 最後に敵が出た時間を初期化
    jump = false;
    jumpVelocity = 0;
    onGround = true;
    requestAnimationFrame(gameLoop); // ゲームループを開始
}

function drawPlayer(x, y) {
    ctx.drawImage(playerImage, x, y, playerSize, playerSize);
}

function drawObstacles(obstacles) {
    obstacles.forEach(obstacle => {
        ctx.drawImage(enemyImage, obstacle[0], obstacle[1], obstacleSize, obstacleSize);
    });
}

function createObstacle() {
    const currentTime = distance; // distanceをフレームカウンターとして使用
    if (currentTime - lastObstacleTime < minObstacleInterval) {
        return null;
    }

    let lanes = Array.from({ length: laneCount }, (_, i) => i);
    lanes = lanes.sort(() => 0.5 - Math.random()).slice(0, 2);

    const obstacles = lanes.map(lane => {
        const xPos = lane * laneWidth + (laneWidth - obstacleSize) / 2;
        return [xPos, 0, lane];
    });

    lastObstacleLane = lanes[lanes.length - 1];
    lastObstacleTime = currentTime;
    
    return obstacles;
}

function drawLanes() {
    for (let i = 0; i < laneCount; i++) {
        ctx.fillStyle = "rgba(0, 0, 0, 0)"; // 透明にして背景が見えるようにする
        ctx.fillRect(i * laneWidth, 0, laneWidth, canvas.height);
    }
}

function drawBackground() {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
}

function drawText(text, x, y) {
    ctx.fillStyle = colors.text;
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.fillText(text, x, y);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground(); // 背景を最初に描画
    drawLanes();

    if (moveDirection !== 0) {
        playerLane += moveDirection;
        if (playerLane < 0) playerLane = 0;
        if (playerLane >= laneCount) playerLane = laneCount - 1;
        playerX = playerLane * laneWidth + (laneWidth - playerSize) / 2;
        moveDirection = 0;
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

    if (Math.random() < 0.05) {
        const newObstacles = createObstacle();
        if (newObstacles) {
            obstacleList.push(...newObstacles);
        }
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

    if (distance % speedIncreaseInterval === 0) {
        obstacleSpeed += speedIncreaseAmount;
    }

    drawPlayer(playerX, playerY);
    drawObstacles(obstacleList);

    drawText(`Distance: ${distance}`, 100, 40);
    drawText(`Lives: ${lives}`, canvas.width - 100, 40);

    requestAnimationFrame(gameLoop);
}
