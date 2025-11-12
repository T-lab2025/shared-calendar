// server.js

// ExpressとCORSを読み込む
const express = require('express');
const cors = require('cors');

const app = express();
const port = 3000; // サーバーが待ち受けるポート番号

// CORSミドルウェアを設定 (どのオリジンからのアクセスも許可する設定)
app.use(cors());
// JSON形式のリクエストボディを扱えるようにする
app.use(express.json());

// --- テスト用のルート (エンドポイント) ---
app.get('/', (req, res) => {
  // ブラウザでアクセスされたら、このメッセージを返す
  res.send('Shared Calendar Backend is running! (Node.js/Express)');
});

// --- サーバーの起動 ---
app.listen(port, () => {
  console.log(`✅ Server listening at http://localhost:${port}`);
  console.log(`このURLにアクセスして動作確認してください。`);
});