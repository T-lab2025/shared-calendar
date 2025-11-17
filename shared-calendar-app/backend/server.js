// server.js

// ExpressとCORSを読み込む
const express = require('express');
const cors = require('cors');

// db.js から db とコレクションパスをインポート
const { db, COLLECTION_PATH } = require('./db'); 

const app = express();
const port = 3000; // サーバーが待ち受けるポート番号

// CORSミドルウェアを設定 (どのオリジンからのアクセスも許可する設定)
app.use(cors());
// JSON形式のリクエストボディを扱えるようにする
app.use(express.json());

// データベース接続がない場合のローカルデータストア（メモリ内）
// サーバーを起動し直すとデータは消えます
let localEvents = []; 

// --- APIエンドポイントの作成 ---

/**
 * GET /api/events
 * 予定をすべて取得する
 */
app.get('/api/events', async (req, res) => {
  // データベースが初期化されていない場合（ローカル開発時など）
  if (!db) {
    console.warn("[GET] データベースが初期化されていません。ローカルデータを返します。");
    return res.status(200).json(localEvents);
    // DB接続がなくても動作確認できるように空配列を返す
  }
  // Firestoreから予定を取得
  try {
    const snapshot = await db.collection(COLLECTION_PATH).get(); 
    // コレクションからドキュメントを取得
    const events = []; // 予定を格納する配列
    // ドキュメントをループして配列に追加
    snapshot.forEach(doc => {
      events.push({ id: doc.id, ...doc.data() }); // ドキュメントIDとデータを結合して追加
    });
    console.log(`[GET] ${events.length} 件の予定を取得しました。`);
    res.status(200).json(events); // 取得した予定をJSONで返す
  } catch (error) {
    console.error("予定の取得エラー:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

/**
 * POST /api/events
 * 新しい予定を追加する
 */

app.post('/api/events', async (req, res) => {
  const { title, date, end_date, personName } = req.body; // リクエストボディから新しい予定データを取得
  if (!title || !date) { // title と date は必須
    return res.status(400).json({ error: "title と date は必須です。" });
  }
  // 新しい予定オブジェクトを作成
  const newEventData = {
    title: title, // 予定のタイトル
    date: date, // 予定の開始日
    end_date: end_date, // 予定の終了日（省略可能）
    personName: personName || '' // 予定の担当者名（省略可能）
  };

  // データベースが初期化されていない場合
  if (!db) {
    const newId = Date.now().toString(); // 一時的なユニークIDを生成
    const eventWithId = { id: newId, ...newEventData }; // IDを含む予定オブジェクトを作成
    localEvents.push(eventWithId); // ローカルデータストアに追加
    console.log(`[POST-LOCAL] 予定が追加されました。ID: ${newId}`);
    return res.status(201).json(eventWithId); // 追加したデータを返す
  }

  // Firestoreに新しい予定を追加
  try {
    // データをFirestoreに追加
    const docRef = await db.collection(COLLECTION_PATH).add(newEvent); // 新しいドキュメントを追加
    console.log(`[POST] 予定が追加されました。ID: ${docRef.id}`);
    // 追加したデータを、新しいIDと共にクライアントに返す
    res.status(201).json({ id: docRef.id, ...newEventData });
  } catch (error) {
    console.error("予定の追加エラー:", error);
    res.status(500).json({ error: "Failed to add event" });
  }
});

/**
 * DELETE /api/events/:id
 * 既存の予定を削除する
 */
app.delete('/api/events/:id', async (req, res) => {
  const eventId = req.params.id; // URLパラメータから予定IDを取得
  if (!eventId) { // 予定IDが指定されていない場合はエラーを返す
    return res.status(400).json({ error: "ID が指定されていません。" });
  }
  // データベースが初期化されていない場合
  if (!db) {
    const initialLength = localEvents.length; // 削除前の配列長を保存
    localEvents = localEvents.filter(event => event.id !== eventId); // ローカルデータストアから削除
    if (localEvents.length < initialLength) { // 削除が成功した場合
        console.log(`[DELETE-LOCAL] 予定 (ID: ${eventId}) が削除されました。`);
        return res.status(204).send(); // 成功レスポンス（内容なし）
    } else { // 削除対象が見つからなかった場合
        return res.status(404).json({ error: "Local event not found" });
    }
  }

  // Firestoreから予定を削除
  try {
    // ドキュメント参照を取得
    const docRef = db.collection(COLLECTION_PATH).doc(eventId);
    // ドキュメントを削除
    await docRef.delete();
    console.log(`[DELETE] 予定 (ID: ${eventId}) が削除されました。`);
    res.status(204).send(); // 成功（コンテンツなし）
  } catch (error) {
    console.error("予定の削除エラー:", error);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

// // --- テスト用のルート (エンドポイント) ---
// app.get('/', (req, res) => {
//   // ブラウザでアクセスされたら、このメッセージを返す
//   res.send('Shared Calendar Backend is running! (Node.js/Express)');
// });

// --- サーバーの起動 ---
app.listen(port, () => {
  console.log(`✅ Server listening at http://localhost:${port}`);
  if (!db) {
    console.log("🔥 データベース接続なしで起動しました。");
  } else {
    console.log("☁️ データベースに接続しました。");
  }
});