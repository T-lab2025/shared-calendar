// backend/db.js
const { initializeApp, cert } = require('firebase-admin/app'); // Firebase Admin SDKの初期化用
const { getFirestore } = require('firebase-admin/firestore'); // Firestore用

// Canvas環境から提供される設定変数を取得（もしあれば）
const firebaseConfigStr = typeof __firebase_config !== 'undefined' ? __firebase_config : null;

let db; // Firestoreデータベースインスタンス
let appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'; // CanvasのApp ID
const COLLECTION_PATH = `artifacts/${appId}/public/data/events`; // Firestoreに保存するコレクションのパス

if (firebaseConfigStr) { // Canvas環境の場合
  try { // Firebase Admin SDKの初期化
    const serviceAccount = JSON.parse(firebaseConfigStr); // JSON文字列をオブジェクトに変換

    // 既に初期化されているか確認
    if (!require('firebase-admin/app').getApps().length) { // 初期化されていない場合のみ初期化
      initializeApp({
        credential: cert(serviceAccount)
        // サービスアカウントキーを使用して認証
      });
    }
    db = getFirestore(); // Firestoreデータベースインスタンスを取得
    console.log("✅ Firebase Admin SDK (Canvas) が正常に初期化されました。");
  } catch (e) { // 初期化エラー処理
    console.error("❌ Firebase Admin SDK (Canvas) の初期化に失敗しました:", e.message);
    db = null; // エラー時はdbをnullに設定
  }
} else {
  // ローカル開発環境（Canvas外）の場合
  // ここに、Firebaseコンソールからダウンロードしたサービスアカウントキー(JSON)のパスを指定します。
  // 例: const serviceAccount = require('./path/to/your-service-account-key.json');
  // 今回は、キーがない状態でもサーバーが起動するよう、dbをnullのままにしておきます。
  console.warn("⚠️ Firebase設定（__firebase_config）が見つかりません。ローカル開発モード（DB接続なし）で起動します。");
  console.warn("ローカルでDBテストを行うには、サービスアカウントキーを 'db.js' に設定してください。");
  db = null;
}

module.exports = { // エクスポート
  db, // Firestoreデータベースインスタンス
  COLLECTION_PATH // Firestoreに保存するコレクションのパス
};