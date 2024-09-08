const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const laneCount = 3;
let laneWidth;
let playerSize = 50;
let obstacleSize = 50;
let obstacleSpeed = 5; // 初期速度
const initialObstacleSpeed = 5;
const speedIncreaseInterval = 500; // 1000メートル（フレーム数）
const speedIncreaseAmount = 1; // 速度の増加量
const gravity = 2; // 重力
const jumpSpeed = 10; // ジャンプ速度
let maxJumpHeight = 150; // ジャンプの最大高さを設定
let lives = 3;
let distance = 0;
let isGameRunning = false; // ゲームが進行中かどうかを追跡

let playerX, playerY, playerLane;
let obstacleList = [];
let jumpVelocity = 0;
let moveDirection = 0; // -1: left, 0: no movement, 1: right
let onGround = true;
let isJumping = false; // ジャンプボタンを長押ししているかどうか
let reachedMaxHeight = false; // 最大高さに達したかどうか
let lastObstacleLane = -1;
let lastObstacleTime = 0;
const minObstacleInterval = 60; // フレーム数（約1秒）

const stars = [];
const starCount = 100;
let scale = 1;

const initialStarSpeed = 1;
let currentStarSpeed = initialStarSpeed;

const colors = {
    text: "white",
};

const playerImage = new Image();
playerImage.src = 'images/player.png'; // プレイヤー画像のパスを指定

const enemyImage = new Image();
enemyImage.src = 'images/enemy.png'; // 通常の敵画像のパスを指定

const threeLaneObstacleImage = new Image();
threeLaneObstacleImage.src = 'images/enemy.png'; // 3レーン障害物の画像のパスを指定

// サウンドエフェクトの追加
const jumpSound = new Audio('sounds/jump.mp4');
const hitSound = new Audio('sounds/hit.mp4');
const gameOverSound = new Audio('sounds/game_over.mp4');

// 左右移動時の音声
const leftMoveSound = new Audio('sounds/left_slide.mp4');
const rightMoveSound = new Audio('sounds/right_slide.mp4');

// BGMの追加
const bgm = new Audio('sounds/background.mp4');
bgm.loop = true; // ループ再生設定

// ゲーム進行中のときのみ操作音を再生する
document.addEventListener("keydown", (e) => {
    if (!isGameRunning) return; // ゲームが進行中でない場合は何もしない

    if (e.key === "ArrowLeft" && moveDirection === 0) {
        moveDirection = -1;
        leftMoveSound.currentTime = 0; // サウンドを再生する前にリセット
        leftMoveSound.play(); // 左移動時のサウンド再生
    }
    if (e.key === "ArrowRight" && moveDirection === 0) {
        moveDirection = 1;
        rightMoveSound.currentTime = 0; // サウンドを再生する前にリセット
        rightMoveSound.play(); // 右移動時のサウンド再生
    }
    if (e.key === " " && onGround && !isJumping) {
        isJumping = true;
        jumpVelocity = -jumpSpeed;
        onGround = false;
        reachedMaxHeight = false;
        jumpSound.currentTime = 0; // サウンドを再生する前にリセット
        jumpSound.play(); // ジャンプ時のサウンド再生
    }
});

document.addEventListener("keyup", (e) => {
    if (!isGameRunning) return; // ゲームが進行中でない場合は何もしない

    if (e.key === " " && isJumping) {
        isJumping = false;
    }
});

canvas.addEventListener('touchstart', function(e) {
    if (!isGameRunning) return; // ゲームが進行中でない場合は何もしない

    e.preventDefault();
    const touchX = e.touches[0].clientX - canvas.offsetLeft;

    if (touchX < canvas.width / 3) {
        // 左側をタップした場合、左に移動
        moveDirection = -1;
        leftMoveSound.currentTime = 0; // サウンドを再生する前にリセット
        leftMoveSound.play(); // 左移動時のサウンド再生
    } else if (touchX > canvas.width * 2 / 3) {
        // 右側をタップした場合、右に移動
        moveDirection = 1;
        rightMoveSound.currentTime = 0; // サウンドを再生する前にリセット
        rightMoveSound.play(); // 右移動時のサウンド再生
    } else {
        // 中央部分をタップした場合、ジャンプ
        if (onGround && !isJumping) {
            isJumping = true;
            jumpVelocity = -jumpSpeed;
            onGround = false;
            reachedMaxHeight = false;
            jumpSound.currentTime = 0; // サウンドを再生する前にリセット
            jumpSound.play(); // ジャンプ時のサウンド再生
        }
    }
});

canvas.addEventListener('touchend', function(e) {
    if (!isGameRunning) return; // ゲームが進行中でない場合は何もしない

    if (isJumping) {
        isJumping = false;
    }
});

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    scale = Math.min(canvas.width / 800, canvas.height / 600);
    laneWidth = (canvas.width / scale) / laneCount;
    
    // スマートフォン向けにサイズを調整
    if (window.innerWidth < 600) {
        playerSize = 30;
        obstacleSize = 30;
        maxJumpHeight = 100;
    } else {
        playerSize = 50;
        obstacleSize = 50;
        maxJumpHeight = 150;
    }
    
    playerY = (canvas.height / scale) - 2 * playerSize;
    if (playerLane !== undefined) {
        playerX = playerLane * laneWidth + (laneWidth - playerSize) / 2;
    }
    initStars();
}

window.addEventListener('resize', resizeCanvas);

function startGame() {
    isGameRunning = true; // ゲーム開始時に進行中フラグを立てる
    document.getElementById("menu").style.display = "none";
    document.getElementById("game-over").style.display = "none";
    playerLane = Math.floor(laneCount / 2);
    playerX = playerLane * laneWidth + (laneWidth - playerSize) / 2;
    playerY = (canvas.height / scale) - 2 * playerSize;
    obstacleList = [];
    lives = 3;
    distance = 0;
    obstacleSpeed = initialObstacleSpeed; // 敵の速度を初期化
    currentStarSpeed = initialStarSpeed; // 星の速度を初期化
    moveDirection = 0;
    lastObstacleTime = 0; // 最後に敵が出た時間を初期化
    jumpVelocity = 0;
    onGround = true;
    isJumping = false;
    reachedMaxHeight = false;
    initStars();
    bgm.currentTime = 0; // BGMを再生する前にリセット
    bgm.play(); // ゲーム開始時にBGMを再生
    requestAnimationFrame(gameLoop); // ゲームループを開始
}

function stopAllSounds() {
    bgm.pause();
    jumpSound.pause();
    hitSound.pause();
    gameOverSound.pause();
    
    bgm.currentTime = 0;
    jumpSound.currentTime = 0;
    hitSound.currentTime = 0;
    gameOverSound.currentTime = 0;
}

function drawPlayer(x, y) {
    ctx.save();
    ctx.scale(scale, scale);
    ctx.drawImage(playerImage, x, y, playerSize, playerSize);
    ctx.restore();
}

function drawObstacles(obstacles) {
    ctx.save();
    ctx.scale(scale, scale);
    obstacles.forEach(obstacle => {
        const image = obstacle[3] === 'threeLane' ? threeLaneObstacleImage : enemyImage;
        ctx.drawImage(image, obstacle[0], obstacle[1], obstacle[2], obstacleSize);
    });
    ctx.restore();
}

function createObstacle() {
    const currentTime = distance; // distanceをフレームカウンターとして使用
    if (currentTime - lastObstacleTime < minObstacleInterval) {
        return null;
    }

    const obstacleType = Math.random(); // 0から1までのランダムな数を生成

    let obstacle;
    if (obstacleType < 0.5) {
        // 1レーンにまたがる障害物
        const lane = Math.floor(Math.random() * laneCount);
        const xPos = lane * laneWidth + (laneWidth - obstacleSize) / 2;
        obstacle = [xPos, 0, obstacleSize, 'singleLane'];
    } else if (obstacleType < 0.8) {
        // 2レーンにまたがる障害物
        const lanes = Array.from({ length: laneCount }, (_, i) => i);
        const selectedLanes = lanes.sort(() => 0.5 - Math.random()).slice(0, 2);
        const xPos = Math.min(...selectedLanes) * laneWidth;
        const width = 2 * laneWidth;
        obstacle = [xPos, 0, width, 'doubleLane'];
    } else {
        // 3レーンにまたがる障害物
        const xPos = 0; // 左端からスタート
        const width = laneCount * laneWidth;
        obstacle = [xPos, 0, width, 'threeLane'];
    }

    lastObstacleTime = currentTime;
    
    return [obstacle];
}

function createStar() {
    return {
        x: Math.random() * (canvas.width / scale),
        y: Math.random() * (canvas.height / scale),
        radius: Math.random() * 2,
        speed: Math.random() * 2 + currentStarSpeed
    };
}

function initStars() {
    stars.length = 0; // 既存の星をクリア
    for (let i = 0; i < starCount; i++) {
        stars.push(createStar());
    }
}

function drawBackground() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(scale, scale);
    ctx.fillStyle = 'white';
    stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
}

function updateStars() {
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height / scale) {
            Object.assign(star, createStar());
            star.y = 0;
        }
    });
}

function drawText(text, x, y) {
    ctx.save();
    ctx.scale(scale, scale);
    ctx.fillStyle = colors.text;
    ctx.font = `${Math.max(16, 24 * scale)}px Arial`; // フォントサイズを調整
    ctx.textAlign = "center";
    ctx.fillText(text, x / scale, y / scale);
    ctx.restore();
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    updateStars();
    drawBackground();

    if (moveDirection !== 0) {
        playerLane += moveDirection;
        if (playerLane < 0) playerLane = 0;
        if (playerLane >= laneCount) playerLane = laneCount - 1;
        playerX = playerLane * laneWidth + (laneWidth - playerSize) / 2;
        moveDirection = 0;
    }

    // ボタン長押しによるジャンプ制御
    if (isJumping) {
        if (!reachedMaxHeight) {
            jumpVelocity = -jumpSpeed; // 上昇を続ける
            playerY += jumpVelocity;
            if (playerY <= (canvas.height / scale) - 2 * playerSize - maxJumpHeight) {
                reachedMaxHeight = true; // 最大高さに達したらフラグを立てる
                playerY = (canvas.height / scale) - 2 * playerSize - maxJumpHeight; // 上昇を停止
                jumpVelocity = 0; // 速度をゼロにして空中で止まる
            }
        }
    } else {
        jumpVelocity += gravity; // ジャンプボタンを離したら重力が働く
        playerY += jumpVelocity;
    }

    if (playerY >= (canvas.height / scale) - 2 * playerSize) {
        playerY = (canvas.height / scale) - 2 * playerSize;
        onGround = true;
        reachedMaxHeight = false; // 地面に着地したら最大高さフラグをリセット
    } else {
        onGround = false;
    }

    if (Math.random() < 0.05) {
        const newObstacles = createObstacle();
        if (newObstacles) {
            obstacleList.push(...newObstacles);
        }
    }

    obstacleList.forEach(obstacle => obstacle[1] += obstacleSpeed);

    // プレイヤーが地面にいる場合のみ当たり判定を行う
    obstacleList = obstacleList.filter(obstacle => {
        const isThreeLane = obstacle[3] === 'threeLane';
        const canJumpOver = isJumping && isThreeLane; // 3レーン障害物でジャンプ中のみ避けられる

        if ((!canJumpOver || onGround) &&
            playerY < obstacle[1] + obstacleSize &&
            playerY + playerSize > obstacle[1] &&
            playerX < obstacle[0] + obstacle[2] &&
            playerX + playerSize > obstacle[0]) {
            lives--;
            hitSound.currentTime = 0; // サウンドを再生する前にリセット
            hitSound.play(); // 衝突時のサウンド再生
            return false; // 衝突した障害物を削除
        }
        return obstacle[1] < canvas.height / scale; // 画面外に出た障害物を削除
    });

    if (lives <= 0) {
        isGameRunning = false; // ゲームオーバー時に進行中フラグを下げる
        stopAllSounds(); // ゲームオーバー時にすべてのサウンドを停止
        gameOverSound.play(); // ゲームオーバー時のサウンド再生
        document.getElementById("final-distance").textContent = `Distance: ${distance}`;
        document.getElementById("game-over").style.display = "block";
        return;
    }

    distance++;

    if (distance % speedIncreaseInterval === 0) {
        obstacleSpeed += speedIncreaseAmount;
        // 背景の星の速度も増加させる
        currentStarSpeed = initialStarSpeed + (obstacleSpeed - initialObstacleSpeed) * 0.5;
        // 既存の星の速度を更新
        stars.forEach(star => {
            star.speed = Math.random() * 2 + currentStarSpeed;
        });
    }

    drawPlayer(playerX, playerY);
    drawObstacles(obstacleList);

    drawText(`Distance: ${distance}`, canvas.width / 4, 40);
    drawText(`Lives: ${lives}`, canvas.width * 3 / 4, 40);

    requestAnimationFrame(gameLoop);
}

// 初期化
resizeCanvas();