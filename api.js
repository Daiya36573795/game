// async function fetchAndDisplayUsers() {
//   const apiUrl = "https://game-api-daiya36573795-daiyas-projects.vercel.app/api/get-unique-users.ts";
//   const userSelectElement = document.getElementById("username-select");

//   try {
//     const response = await fetch(apiUrl);
//     if (!response.ok) {
//       throw new Error(`HTTPエラー: ${response.status}`);
//     }

//     const data = await response.json(); // 例: ["aika", "tuchida"]

//     // データを<option>に追加
//     data.forEach(name => {
//       const option = document.createElement("option");
//       option.value = name; // value属性にnameを設定
//       option.textContent = name; // 表示テキストにnameを設定
//       userSelectElement.appendChild(option); // <select>に追加
//     });
//   } catch (error) {
//     console.error("データの取得中にエラーが発生しました:", error);

//     // エラー表示を画面に追加
//     const errorMessage = document.createElement("p");
//     errorMessage.textContent = "データの取得に失敗しました。";
//     document.body.appendChild(errorMessage);
//   }
// }

// async function submitScore(name, distance) {
//   const apiUrl = "https://game-api-daiya36573795-daiyas-projects.vercel.app/api/add-score.ts"; // APIエンドポイントを指定

//   try {
//     const response = await fetch(apiUrl, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ name, distance }), // リクエストボディにデータを設定
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(`エラー: ${errorData.error}`);
//     }

//     const result = await response.json();
//     console.log("APIのレスポンス:", result);

//     // 成功メッセージを表示
//     alert("スコアが登録されました！\n" + JSON.stringify(result.data));
//   } catch (error) {
//     console.error("API呼び出しエラー:", error);
//     alert("スコア登録中にエラーが発生しました。\n" + error.message);
//   }
// }

// // ページロード時に実行
// document.addEventListener("DOMContentLoaded", fetchAndDisplayUsers);
