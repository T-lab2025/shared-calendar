// Reactのフック (useState, useEffect) をインポート
import React, { useState, useEffect } from 'react'; // Reactのインポート
// FullCalendar本体と必要なプラグインをインポート
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'; // 日表示・週表示プラグイン
import interactionPlugin from '@fullcalendar/interaction'; // クリック操作プラグイン

 // CSSファイルのインポート
import './App.css'
// バックエンドAPIのベースURLを設定
const API_URL = 'http://localhost:3000/api/events';

function App() {
  // カレンダーに表示する予定を管理するステート
  const [events, setEvents] = useState([
    // { title: '授業', date: '2025-11-18' },
    // { title: 'ゼミ', date: '2025-11-18' }
  ]);
  // 読み込み中/エラーの状態を管理
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // NOTE: alert()やconfirm()は非推奨ですが、ここでは動作確認用として使用します。
  // 最終的にはカスタムUIに置き換えてください。

  /**
   * 1. サーバーから予定を取得する関数 (GET)
   */
  const fetchEvents = async () => {
    setLoading(true); // 読み込み中に設定
    setError(null); // エラー状態をリセット
    try {
      const response = await fetch(API_URL); // APIから予定を取得

      //DB接続がない場合（ローカル開発時の警告）も、空のJSONを想定して処理を続行
      if (!response.ok) {
        // エラーステータスの場合は例外をスロー
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json(); // レスポンスをJSONとしてパース

      // FullCalendarの形式にデータを変形
      const formattedEvents = data.map(event => ({
        id: event.id,       // データベースのID
        title: event.title, // 'タイトル' フィールドを 'title' として使用
        date: event.date    // 'date' フィールドを 'start' として使用
      }));

      setEvents(formattedEvents); // ステートに予定をセット
    } catch (err) {
      console.error("データの取得に失敗しました:", err);
      setError("サーバーから予定を取得できませんでした。backendが起動しているか確認してください。");
      
      // DB接続なしの場合でもフロントが動くように、ダミーデータを表示
      setEvents([
        { id: 'local-dummy', title: '（ローカル開発モード）', start: new Date().toISOString().slice(0, 10) }
      ]);
    } finally {
      setLoading(false); // 読み込み完了
    }
  };

  // 最初に画面が表示された時、一度だけ予定を取得する
  useEffect(() => {
    fetchEvents();
  }, []); // [] は「マウント時に1回だけ実行」という意味

  /**
   * 2. 日付クリック時に予定を追加する関数 (POST)
   */
  const handleDateClick = async (info) => {
    // NOTE: ここで prompt() を使用
    const title = prompt(`日付 ${info.dateStr} に追加する予定を入力してください:`);

    // 入力があった場合のみ追加処理を実行
    if (title && title.trim()) { // 空白のみの入力を防止
      // 新しい予定オブジェクトを作成
      const newEvent = { // 予定データ
        title: title.trim(), // トリムして余分な空白を削除
        date: info.dateStr,  // クリックされた日付
      };
      // サーバーに新しい予定を送信
      try {
        const response = await fetch(API_URL, { // APIエンドポイント
          method: 'POST', // HTTPメソッド
          headers: { 'Content-Type': 'application/json' }, // JSON形式のデータを送信
          body: JSON.stringify(newEvent), // 予定データをJSON文字列に変換して送信
        });

        // レスポンスのステータスを確認
        if (!response.ok) {
          throw new Error('予定の追加に失敗しました。');
        }

        // 追加に成功したら、カレンダーを再読み込みして表示に反映
        fetchEvents();
      } catch (err) {
        console.error("予定の追加に失敗しました:", err);
        setError("予定の追加に失敗しました。");
      }
    }
  };

  /**
   * 3. 予定クリック時に予定を削除する関数 (DELETE)
   */
  const handleEventClick = async (info) => {
    // NOTE: ここで window.confirm() を使用

    // ユーザーに削除確認
    if (window.confirm(`予定 "${info.event.title}" を削除しますか？`)) {
      const eventId = info.event.id; // クリックされた予定のIDを取得

      // サーバーに削除リクエストを送信
      try {
        const response = await fetch(`${API_URL}/${eventId}`, {
          method: 'DELETE', 
        });

        // レスポンスのステータスを確認
        if (response.status !== 204) {
          throw new Error('予定の削除に失敗しました。');
        }

        // 削除に成功したら、カレンダーを再読み込み
        fetchEvents();
      } catch (err) {
        console.error("予定の削除に失敗しました:", err);
        setError("予定の削除に失敗しました。");
      }
    }
  };

  // カレンダーの設定
  const calendarOptions = {
    // 使用するプラグイン
    plugins: [
      dayGridPlugin,  // 日表示・週表示プラグインを追加
      interactionPlugin // クリック操作プラグインを追加
    ], 
    initialView: 'dayGridMonth', // 初期表示を月表示に設定

    // カレンダーの見た目と操作性の設定
    headerToolbar: {
      left: 'prev,next today', // 左側に前月・次月・今日ボタンを配置
      center: 'title', // 中央にタイトルを配置
      right: 'dayGridMonth,dayGridWeek,dayGridDay' // 右側に月・週・日表示切替ボタンを配置
    },

    // 言語設定
    locale: 'ja', // 日本語に設定
    
    weekends: true, // 土日を有効にする

    selectable: true, // 期間選択を有効にする

    // 予定データとしてステートを渡す
    events: events,   
    // 処理関数を渡す
    dateClick: handleDateClick,  // 日付クリック時の処理     
    eventClick: handleEventClick // 予定クリック時の処理
  };

  // 読み込み中・エラー・正常時で表示を切り替える
  if (loading) {
    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <h1>📅 T-lab2025 共有カレンダー</h1>
            <p style={{ textAlign: 'center' }}>データ読み込み中...</p>
        </div>
    );
  }

  return (
    <>
      <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
        <h1>📅 T-lab2025 共有カレンダー</h1>
        <p>（バックエンドAPI (DB) と通信しています）</p>
        {error && <p style={{ color: 'red', textAlign: 'center' }}>エラー: {error}</p>}

        <FullCalendar {...calendarOptions} />
      </div>
    </>
  )
}

export default App