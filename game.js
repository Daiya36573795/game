async function fetchAndDisplayUsers() {
    const apiUrl = "https://game-api-daiya36573795-daiyas-projects.vercel.app/api/get-unique-users.ts";
    const userSelectElement = document.getElementById("username-select");

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTPエラー: ${response.status}`);
        }

        const data = await response.json(); // 例: ["aika", "tuchida"]

        // データを<option>に追加
        data.forEach(name => {
            const option = document.createElement("option");
            option.value = name; // value属性にnameを設定
            option.textContent = name; // 表示テキストにnameを設定
            userSelectElement.appendChild(option); // <select>に追加
        });
    } catch (error) {
        console.error("データの取得中にエラーが発生しました:", error);

        // エラー表示を画面に追加
        const errorMessage = document.createElement("p");
        errorMessage.textContent = "データの取得に失敗しました。";
        document.body.appendChild(errorMessage);
    }
}

async function submitScore(name, distance) {
    const apiUrl = "https://game-api-daiya36573795-daiyas-projects.vercel.app/api/add-score.ts"; // APIエンドポイントを指定

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, distance }), // リクエストボディにデータを設定
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`エラー: ${errorData.error}`);
        }

        const result = await response.json();
        console.log("APIのレスポンス:", result);

        // 成功メッセージを表示
        alert("スコアが登録されました！\n" + JSON.stringify(result.data));

        return true; // 成功時に true を返す
    } catch (error) {
        console.error("API呼び出しエラー:", error);
        alert("スコア登録中にエラーが発生しました。\n" + error.message);

        return false; // エラー時に false を返す
    }
}


async function fetchAndDisplayScores(name) {
    if (!name) {
        console.error("名前が必要です。");
        return;
    }

    const apiUrl = `https://game-api-daiya36573795-daiyas-projects.vercel.app/api/get-scores?name=${encodeURIComponent(name)}`;

    try {
        const response = await fetch(apiUrl, {
            method: "GET",
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("エラー:", errorData.error);
            return;
        }

        const data = await response.json(); // APIデータを取得
        console.log("取得したデータ:", data);

        // データを<li>に格納して表示
        const listElement = document.getElementById("ranking-list");

        // リストを初期化
        listElement.innerHTML = "";

        // 各スコアデータを<li>として追加
        data.forEach((score) => {
            const listItem = document.createElement("li");
            listItem.textContent = `Name: ${score.name}, Distance: ${score.distance}, Date: ${score.date}`;
            listElement.appendChild(listItem);
        });
    } catch (error) {
        console.error("API呼び出し中にエラーが発生しました:", error);
    }
}

async function handleScoreSubmission(savedUsername, distance) {
    // スコアをDBに登録
    const isSubmitted = await submitScore(savedUsername, distance);

    console.log(isSubmitted);

    if (isSubmitted) {
        // 登録が成功した場合にスコア一覧を取得
        await fetchAndDisplayScores(savedUsername);
    } else {
        console.error("スコア登録に失敗したため、取得処理をスキップします。");
    }
}

// ページロード時に実行
document.addEventListener("DOMContentLoaded", fetchAndDisplayUsers);


// -------------------------------------------------------------------------------------------


// キャンバスと描画コンテキストの取得
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ゲーム設定に関する変数
const laneCount = 2; // レーンの数を2に設定
let laneWidth; // 各レーンの幅
let playerSize = 50; // プレイヤーのサイズ
let obstacleSize = 50; // 障害物のサイズ
let obstacleSpeed = 5; // 障害物の初期速度
const initialObstacleSpeed = 5; // 障害物の初期速度を保存
const maxObstacleSpeed = 15; // 障害物の最大速度（上限）
const speedIncreaseInterval = 500; // 500フレームごとに速度を増加
const speedIncreaseAmount = 1; // 速度の増加量
let distance = 0; // プレイヤーが進んだ距離
let isGameRunning = false; // ゲームが進行中かどうかのフラグ

// プレイヤーと障害物に関する変数
let playerX, playerY, playerLane; // プレイヤーの位置とレーン
let obstacleList = []; // 障害物のリスト
let moveDirection = 0; // プレイヤーの移動方向 (-1: 左, 0: なし, 1: 右)
let lastObstacleLane = -1; // 最後に障害物が出現したレーン
let lastObstacleTime = 0; // 最後に障害物が出現した時間
const minObstacleInterval = 180; // 障害物が出現する最小間隔（フレーム数）

// 背景の星に関する変数
const stars = []; // 星のリスト
const starCount = 100; // 星の数
let scale = 1; // キャンバスのスケーリング比率

const initialStarSpeed = 1; // 星の初期速度
let currentStarSpeed = initialStarSpeed; // 星の現在の速度

const colors = {
    text: "white", // テキストの色を白に設定
};

// 画像オブジェクトの作成と画像の読み込み
const playerImage = new Image();
playerImage.src = 'images/player.png'; // プレイヤー画像のパスを指定

const enemyImage = new Image();
enemyImage.src = 'images/enemy.png'; // 敵（障害物）画像のパスを指定

// プレイヤーのライフ数
let lives = 3;

// 音声エフェクトの追加（背景音楽は除く）
const hitSound = new Audio('sounds/hit.mp4');
const gameOverSound = new Audio('sounds/game_over.mp4');

// 左右移動時の音声
const leftMoveSound = new Audio('sounds/left_slide.mp4');
const rightMoveSound = new Audio('sounds/right_slide.mp4');

// キーボード入力の処理
document.addEventListener("keydown", (e) => {
    if (!isGameRunning) return; // ゲームが進行中でない場合は無視

    if (e.key === "ArrowLeft" && moveDirection === 0) {
        moveDirection = -1; // 左に移動
        leftMoveSound.currentTime = 0; // サウンドをリセット
        leftMoveSound.play(); // 左移動時のサウンド再生
    }
    if (e.key === "ArrowRight" && moveDirection === 0) {
        moveDirection = 1; // 右に移動
        rightMoveSound.currentTime = 0; // サウンドをリセット
        rightMoveSound.play(); // 右移動時のサウンド再生
    }
});

// タッチ入力の処理
canvas.addEventListener('touchstart', function (e) {
    if (!isGameRunning) return; // ゲームが進行中でない場合は無視

    e.preventDefault();
    const touchX = e.touches[0].clientX - canvas.offsetLeft;

    if (touchX < canvas.width / 3) {
        moveDirection = -1; // 左側をタップした場合
        leftMoveSound.currentTime = 0; // サウンドをリセット
        leftMoveSound.play(); // 左移動時のサウンド再生
    } else if (touchX > canvas.width * 2 / 3) {
        moveDirection = 1; // 右側をタップした場合
        rightMoveSound.currentTime = 0; // サウンドをリセット
        rightMoveSound.play(); // 右移動時のサウンド再生
    }
});

// キャンバスのサイズをウィンドウサイズに合わせてリサイズ
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    scale = Math.min(canvas.width / 800, canvas.height / 600); // スケール比率を計算
    laneWidth = (canvas.width / scale) / laneCount; // レーンの幅を計算

    playerY = (canvas.height / scale) - 2 * playerSize; // プレイヤーのY座標を設定
    if (playerLane !== undefined) {
        playerX = playerLane * laneWidth + (laneWidth - playerSize) / 2; // プレイヤーのX座標を設定
    }
    initStars(); // 背景の星を初期化
}

// ウィンドウサイズが変更されたときにキャンバスをリサイズ
window.addEventListener('resize', resizeCanvas);

// ゲーム開始時の初期化処理
function startGame() {
    isGameRunning = true; // ゲームが進行中に設定
    document.getElementById("menu").style.display = "none"; // メニュー画面を非表示
    document.getElementById("game-over").style.display = "none"; // ゲームオーバー画面を非表示

    playerLane = Math.floor(laneCount / 2); // プレイヤーを中央のレーンに配置
    playerX = playerLane * laneWidth + (laneWidth - playerSize) / 2; // プレイヤーのX座標を設定
    playerY = (canvas.height / scale) - 2 * playerSize; // プレイヤーのY座標を設定

    obstacleList = []; // 障害物のリストを初期化
    lives = 3; // ライフを初期化
    distance = 0; // 距離を初期化
    obstacleSpeed = initialObstacleSpeed; // 障害物の速度を初期化
    currentStarSpeed = initialStarSpeed; // 星の速度を初期化
    moveDirection = 0; // 移動方向を初期化
    lastObstacleTime = 0; // 最後の障害物出現時間を初期化
    initStars(); // 背景の星を初期化
    requestAnimationFrame(gameLoop); // ゲームループを開始
}

// メニュー画面に戻る処理
function goToMenu() {
    isGameRunning = false; // ゲームを停止
    document.getElementById("menu").style.display = "block"; // メニュー画面を表示
    document.getElementById("game-over").style.display = "none"; // ゲームオーバー画面を非表示
    stopAllSounds(); // すべての音声を停止
}

// すべての音声を停止する関数
function stopAllSounds() {
    hitSound.pause();
    gameOverSound.pause();
    leftMoveSound.pause();
    rightMoveSound.pause();

    hitSound.currentTime = 0;
    gameOverSound.currentTime = 0;
    leftMoveSound.currentTime = 0;
    rightMoveSound.currentTime = 0;
}

// プレイヤーを描画
function drawPlayer(x, y) {
    ctx.save();
    ctx.scale(scale, scale); // スケーリングを適用
    ctx.drawImage(playerImage, x, y, playerSize, playerSize); // プレイヤー画像を描画
    ctx.restore();
}

// 障害物を描画
function drawObstacles(obstacles) {
    ctx.save();
    ctx.scale(scale, scale); // スケーリングを適用
    obstacles.forEach(obstacle => {
        ctx.drawImage(enemyImage, obstacle[0], obstacle[1], obstacle[2], obstacleSize); // 障害物を描画
    });
    ctx.restore();
}

// 障害物を生成
function createObstacle() {
    const currentTime = distance; // 現在の距離を時間として使用
    if (currentTime - lastObstacleTime < minObstacleInterval) {
        return null; // 最小間隔未満の場合は生成しない
    }

    // 前回とは異なるレーンを選択
    let lane;
    do {
        lane = Math.floor(Math.random() * laneCount); // レーンをランダムに選択
    } while (lane === lastObstacleLane);

    const xPos = lane * laneWidth + (laneWidth - obstacleSize) / 2; // 障害物のX座標を計算
    const obstacle = [xPos, 0, obstacleSize]; // 障害物の情報を配列に格納

    lastObstacleLane = lane; // 最後に出現したレーンを更新
    lastObstacleTime = currentTime; // 最後に障害物を生成した時間を更新

    return [obstacle]; // 新しい障害物を返す
}

// 背景の星を生成
function createStar() {
    return {
        x: Math.random() * (canvas.width / scale), // 星のX座標をランダムに設定
        y: Math.random() * (canvas.height / scale), // 星のY座標をランダムに設定
        radius: Math.random() * 2, // 星の半径をランダムに設定
        speed: Math.random() * 2 + currentStarSpeed // 星の速度を設定
    };
}

// 背景の星を初期化
function initStars() {
    stars.length = 0; // 既存の星をクリア
    for (let i = 0; i < starCount; i++) {
        stars.push(createStar()); // 新しい星を追加
    }
}

// 背景を描画
function drawBackground() {
    ctx.fillStyle = 'black'; // 背景色を黒に設定
    ctx.fillRect(0, 0, canvas.width, canvas.height); // 背景を描画

    ctx.save();
    ctx.scale(scale, scale); // スケーリングを適用
    ctx.fillStyle = 'white'; // 星の色を白に設定
    stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2); // 星を描画
        ctx.fill();
    });
    ctx.restore();
}

// 星の位置を更新
function updateStars() {
    stars.forEach(star => {
        star.y += star.speed; // 星のY座標を更新
        if (star.y > canvas.height / scale) {
            Object.assign(star, createStar()); // 星が画面下に出たら再生成
            star.y = 0; // Y座標をリセット
        }
    });
}

// テキストを描画
function drawText(text, x, y) {
    ctx.save();
    ctx.scale(scale, scale); // スケーリングを適用
    ctx.fillStyle = colors.text; // テキストの色を設定
    ctx.font = `${Math.max(16, 20 * scale)}px Arial`; // フォントサイズを設定
    ctx.textAlign = "center"; // テキストの位置を中央揃え
    ctx.fillText(text, x / scale, y / scale); // テキストを描画
    ctx.restore();
}

// メインのゲームループ
function gameLoop() {
    if (!isGameRunning) return; // ゲームが進行中でない場合は終了

    ctx.clearRect(0, 0, canvas.width, canvas.height); // キャンバスをクリア

    updateStars(); // 星の位置を更新
    drawBackground(); // 背景を描画

    // プレイヤーの移動処理
    if (moveDirection !== 0) {
        playerLane += moveDirection; // レーンを移動
        if (playerLane < 0) playerLane = 0; // レーンの下限をチェック
        if (playerLane >= laneCount) playerLane = laneCount - 1; // レーンの上限をチェック
        playerX = playerLane * laneWidth + (laneWidth - playerSize) / 2; // プレイヤーのX座標を更新
        moveDirection = 0; // 移動方向をリセット
    }

    // 障害物の生成
    if (Math.random() < 0.05) {
        const newObstacles = createObstacle();
        if (newObstacles) {
            obstacleList.push(...newObstacles); // 新しい障害物をリストに追加
        }
    }

    // 障害物の位置を更新
    obstacleList.forEach(obstacle => obstacle[1] += obstacleSpeed);

    // 衝突判定と障害物の削除
    obstacleList = obstacleList.filter(obstacle => {
        if (
            playerY < obstacle[1] + obstacleSize &&
            playerY + playerSize > obstacle[1] &&
            playerX < obstacle[0] + obstacle[2] &&
            playerX + playerSize > obstacle[0]
        ) {
            lives--; // ライフを減らす
            hitSound.currentTime = 0; // サウンドをリセット
            hitSound.play(); // 衝突時のサウンド再生
            return false; // 衝突した障害物を削除
        }
        return obstacle[1] < canvas.height / scale; // 画面外に出た障害物を削除
    });

    // ゲームオーバーの判定
    if (lives <= 0) {
        isGameRunning = false; // ゲームを停止
        gameOverSound.play(); // ゲームオーバー時のサウンド再生
        document.getElementById("final-distance").textContent = `Distance: ${distance}`; // 最終距離を表示
        document.getElementById("game-over").style.display = "block"; // ゲームオーバー画面を表示

        const savedUsername = localStorage.getItem('selectedUsername') || "Guest";
        handleScoreSubmission(savedUsername, distance);
        return;
    }

    distance++; // 距離を増加

    // 一定距離ごとに速度を増加（上限まで）
    if (distance % speedIncreaseInterval === 0) {
        if (obstacleSpeed < maxObstacleSpeed) {
            obstacleSpeed += speedIncreaseAmount; // 障害物の速度を増加
        }
        currentStarSpeed = initialStarSpeed + (obstacleSpeed - initialObstacleSpeed) * 0.5; // 星の速度を更新
        stars.forEach(star => {
            star.speed = Math.random() * 2 + currentStarSpeed; // 星の速度を再設定
        });
    }

    drawPlayer(playerX, playerY); // プレイヤーを描画
    drawObstacles(obstacleList); // 障害物を描画

    // スコアとライフを表示
    drawText(`Distance: ${distance}`, canvas.width / 4, 40);
    drawText(`Lives: ${lives}`, canvas.width * 3 / 4, 40);

    requestAnimationFrame(gameLoop); // 次のフレームをリクエスト
}

// ゲームの初期化
resizeCanvas();
