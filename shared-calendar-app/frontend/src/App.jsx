import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'; // 日表示・週表示プラグイン
import interactionPlugin from '@fullcalendar/interaction'; // クリック操作プラグイン

import './App.css' // CSSファイルのインポート

function App() {

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

    // 予定データ（初期データとして空の配列を設定）
    events: [
      { title: '授業', date: '2025-11-18' },
      { title: 'ゼミ', date: '2025-11-18' }
    ],

    // 処理機能

    // 日付クリック時の処理
    dateClick: function(info) {
      alert('日付: ' + info.dateStr + ' をクリックしました！');
      // ここに、予定追加用のモーダル表示処理などを実装します
    },

    // 予定をクリックしたときの処理
    eventClick: function(info) {
      alert('予定: ' + info.event.title + ' をクリックしました！');
      // ここに、予定編集用のモーダル表示処理などを実装します
    }
  };

  return (
    <>
      <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
        <h1>📅 T-lab2025 共有カレンダー</h1>
        <p>（バックエンドのデータ取得はまだなので、現在はダミーデータか空です）</p>

        <FullCalendar
          {...calendarOptions} // 上で定義したカレンダーオプションを渡す
        />
      </div>
    </>
  )
}

export default App