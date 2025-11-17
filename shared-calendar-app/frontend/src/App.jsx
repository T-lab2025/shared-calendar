// Reactのフック (useState, useEffect) をインポート
import React, { useState, useEffect } from 'react'; // Reactのインポート
// FullCalendar本体と必要なプラグインをインポート
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'; // 日表示・週表示プラグイン
import interactionPlugin from '@fullcalendar/interaction'; // クリック操作プラグイン
import timeGridPlugin from '@fullcalendar/timegrid'; // 時間表示プラグイン

// CSSファイルのインポート
import './App.css'
// バックエンドAPIのベースURLを設定
const API_URL = 'http://localhost:3000/api/events';

// --- 時刻フォーマット関数 ---
// DateオブジェクトをHH:MM形式の文字列に変換
const formatTime = (date) => {
    if (!date) return '09:00'; // デフォルト値
    // dateが文字列（ISO形式）の場合はDateオブジェクトに変換
    const d = typeof date === 'string' ? new Date(date) : date;

    // UTC時刻を避け、ローカル時刻でHH:MMを生成
    return d.toLocaleTimeString('ja-JP', { 
        hour: '2-digit',
        minute: '2-digit', 
        hour12: false // 24時間表示
    });
};

// DateオブジェクトをYYYY-MM-DD形式の文字列に変換
const formatDate = (date) => {
    if (!date) return new Date().toISOString().split('T')[0]; // デフォルトは今日の日付
    const d = typeof date === 'string' ? new Date(date) : date; // 文字列ならDateオブジェクトに変換
    return d.toISOString().split('T')[0]; // YYYY-MM-DD形式で返す
};

// --- モーダルコンポーネントをApp.jsx内に定義 ---
const EventModal = ({
  isOpen,         // モーダルが開いているか (true/false)
  onClose,        // モーダルを閉じる関数
  onSave,         // 予定を保存する関数
  onDelete,       // 予定を削除する関数
  selectedDate,   // (新規追加用) 選択された日付
  selectedEvent   // (削除用) 選択された予定
}) => {
  const [title, setTitle] = useState(''); // 予定タイトルのステート
  const [date, setDate] = useState(''); // 日付 (YYYY-MM-DD)
  const [startTime, setStartTime] = useState('09:00'); // 開始時刻 (HH:MM)
  const [endTime, setEndTime] = useState('10:00'); // 終了時刻 (HH:MM)
  const [personName, setPersonName] = useState(''); // 担当者名のステート

  // モーダルが開くときに、インプットの初期値を設定
  useEffect(() => {
    if (!isOpen) return; // モーダルが閉じている場合は何もしない

    // 新規追加モード
    if (selectedDate) {
      // 追加モードの場合
      const start = new Date(selectedDate.startStr);
      // 日付を設定
      setDate(formatDate(start));

      // 終日でない（時間軸がクリックされた）場合は、その時刻を初期値にする
      if (!selectedDate.allDay && selectedDate.startStr && selectedDate.endStr) { // 時間軸がクリックされた場合
          setStartTime(formatTime(start)); // 開始時刻を設定
          setEndTime(formatTime(new Date(selectedDate.endStr))); // 終了時刻を設定
      } else {
          // 月表示などで日付のみクリックされた場合は、デフォルトの時刻を設定
          setStartTime('09:00'); // デフォルト開始時刻
          setEndTime('10:00'); // デフォルト終了時刻
      }
      setTitle(''); // タイトルは空にする
      setPersonName(''); // 担当者名は空にする

      } else if (selectedEvent) {
      // 編集/削除モードの場合 (今回は削除のみ)
      setTitle(selectedEvent.title);
      // 既存の予定から日付・時刻を読み込むロジックをここに実装する（省略）

    }
  }, [isOpen, selectedDate, selectedEvent]);

  if (!isOpen) return null; // モーダルが閉じている場合は何も表示しない

  // モーダルの背景（オーバーレイ）をクリックしたときに閉じる
  const handleOverlayClick = (e) => {
    if (e.target.id === 'modal-overlay') { // オーバーレイ部分をクリックした場合
      onClose();
    }
  };

  // 保存ボタンが押されたときの処理
  const handleSaveClick = () => {
    if (!title || !title.trim() || !date || !startTime || !endTime) {
      alert("すべてのフィールドを入力してください。");
      return;
    }
    // onSaveに、入力されたすべてのデータを渡す
    onSave({
        title: title.trim(),
        date: date,
        startTime: startTime,
        endTime: endTime,
        personName: personName.trim()
    });
  };

  // 削除ボタンが押されたときの処理
  const handleDeleteClick = () => {
    if (selectedEvent && selectedEvent.id) { // 安全のためIDが存在するか確認
        if (window.confirm(`予定 "${selectedEvent.title}" (ID: ${selectedEvent.id}) を本当に削除しますか？`)) {
            onDelete(selectedEvent.id); // IDを渡して削除
        }
    } else {
        alert("エラー: 削除する予定のIDが見つかりません。");
    }
  };

  const isAdding = !!selectedDate; // 日付が選択されていれば「追加モード」
  const isDeleting = !!selectedEvent; // 予定が選択されていれば「削除モード」

  return (
    <div id="modal-overlay" className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        {isAdding && (
          <>
            <h2>予定の追加</h2>
            <div className="input-group">
                <label>予定のタイトル</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="タイトルを入力" 
                  autoFocus
                />
            </div>

            {/* 人物名入力フィールド */}
            <div className="input-group">
                <label>人物名 (任意)</label>
                <input 
                  type="text" 
                  value={personName} 
                  onChange={(e) => setPersonName(e.target.value)} 
                  placeholder="名前を入力 (例: 田中)" 
                />
            </div>
            
            <div className="input-group">
                <label>日付</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                />
            </div>

            <div className="input-row">
                <div className="input-group half">
                    <label>予定の開始時刻</label>
                    <input 
                      type="time" 
                      value={startTime} 
                      onChange={(e) => setStartTime(e.target.value)} 
                    />
                </div>
                <div className="input-group half">
                    <label>予定の終了時刻</label>
                    <input 
                      type="time" 
                      value={endTime} 
                      onChange={(e) => setEndTime(e.target.value)} 
                    />
                </div>
            </div>
            
            <div className="modal-actions">
              <button onClick={handleSaveClick} className="modal-button primary">保存</button>
              <button onClick={onClose} className="modal-button">キャンセル</button>
            </div>
          </>
        )}

        {isDeleting && (
          <>
            <h2>予定の削除</h2>
            {/* 削除モーダルでもタイトルを表示 */}
            <p>タイトル: {selectedEvent.title}</p>
            <p style={{ marginTop: '15px', color: '#dc3545' }}>この予定を削除しますか？</p>
            <div className="modal-actions">
              <button onClick={handleDeleteClick} className="modal-button danger">削除</button>
              <button onClick={onClose} className="modal-button">キャンセル</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};


function App() {
  // すべての予定を管理するステート
  const [allEvents, setAllEvents] = useState([]);
  // カレンダーに表示する予定を管理するステート
  const [events, setEvents] = useState([]);
  // フィルタリング用の担当者リスト
  const [personList, setPersonList] = useState([]);
  // 選択された担当者名
  const [selectedPerson, setSelectedPerson] = useState('');
  // 読み込み中/エラーの状態を管理
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // モーダルの状態管理
  const [modalOpen, setModalOpen] = useState(false); // モーダルの開閉状態
  const [selectedDate, setSelectedDate] = useState(null); // 新規追加用
  const [selectedEvent, setSelectedEvent] = useState(null); // 削除用

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

      setAllEvents(data); // すべての予定をステートにセット

      // 担当者名のリストを抽出してステートにセット
      const names = new Set(data.map(e => e.personName).filter(Boolean)); // 空でない名前だけ抽出
      setPersonList([...names]); // Setを配列に変換してセット

    } catch (err) {
      console.error("データの取得に失敗しました:", err);
      setError("サーバーから予定を取得できませんでした。backendが起動しているか確認してください。");
      // エラー時は予定を空にする
      setEvents([]);
    } finally {
      setLoading(false); // 読み込み完了
    }
  };

  // 最初に画面が表示された時、一度だけ予定を取得する
  useEffect(() => {
    fetchEvents();
  }, []); // [] は「マウント時に1回だけ実行」という意味


  //
  useEffect(() => {
    let filtered = allEvents; // 初期状態はすべての予定

    // 絞り込み処理
    if (selectedPerson) {
      filtered = allEvents.filter(event => event.personName === selectedPerson);
    }

    // FullCalendarの形式にデータを変形
    const formattedEvents = filtered.map(event => ({
      id: event.id, // データベースのID
      title: event.personName // 人物名があればタイトルに含める
               ? `${event.title} (${event.personName})` // タイトルに人物名を追加
               : event.title, // 予定のタイトル
      start: event.date, // 予定の開始日
      end: event.end_date || undefined, // 予定の終了日（省略可能）
      // 元のデータを extendedProps に保持 (削除モーダルで使うため)
      extendedProps: {
        originalTitle: event.title, // 元のタイトル
        personName: event.personName // 担当者名
      }
    }));

    setEvents(formattedEvents); // ステートに予定をセット

  }, [allEvents, selectedPerson]); // allEvents または selectedPerson が変わったときに実行



  const handleSelect = (info) => { // 日付範囲が選択されたときの処理
    setModalOpen(true); // モーダルを開く
    setSelectedDate(info); // 選択した日付範囲をセット
    setSelectedEvent(null); // 削除モードを解除
  };

  /**
   * 2. 日付クリック時: モーダルを開く (追加モード)
   */
  const handleDateClick = (info) => {
    // 日付クリック時に選択処理を呼び出す
    handleSelect({
        startStr: info.dateStr, // クリックされた日付の文字列
        endStr: info.dateStr, // 終了日も同じに設定（単一日付選択）
        allDay: info.allDay, // 終日フラグ
    });
  };

  /**
   * 3. 予定クリック時: モーダルを開く (削除モード)
   */
  const handleEventClick = (info) => {
    setModalOpen(true); // モーダルを開く
    setSelectedEvent(info.event); // 選択した予定をセット
    setSelectedDate(null); // 追加モードを解除
  };

  /**
   * 4. モーダルを閉じる
   */
  const closeModal = () => {
    setModalOpen(false); // モーダルを閉じる
    setSelectedDate(null); // 選択した日付をリセット
    setSelectedEvent(null); // 選択した予定をリセット
  };

  /**
   * 5. モーダルで「保存」が押されたときの処理 (POST)
   */
  const handleModalSave = async ({ title, date, startTime, endTime, personName }) => { // 引数で予定データを受け取る
    // YYYY-MM-DDTHH:MM:SS 形式のISO文字列を作成
    const startDateTime = `${date}T${startTime}:00`; // 秒は:00で固定
    const endDateTime = `${date}T${endTime}:00`; // 秒は:00で固定

    const newEvent = {
      title: title, // モーダルから渡されたタイトル
      date: startDateTime, // FullCalendarの'start'に対応
      end_date: endDateTime, // FullCalendarの'end'に対応
      personName: personName // モーダルから渡された担当者名
    };

    // サーバーに新しい予定を送信
    try {
      const response = await fetch(API_URL, {
        method: 'POST', // POSTメソッドで送信
        headers: { 'Content-Type': 'application/json' }, // JSON形式で送信
        body: JSON.stringify(newEvent), // 予定データをJSON文字列に変換して送信
      });
      if (!response.ok) throw new Error('予定の追加に失敗しました。');
      
      fetchEvents(); // カレンダーを再読み込み
      closeModal(); // モーダルを閉じる
    } catch (err) {
      console.error("予定の追加に失敗しました:", err);
      setError("予定の追加に失敗しました。");
    }
  };

  /**
   * 6. モーダルで「削除」が押されたときの処理 (DELETE)
   */
  const handleModalDelete = async (eventId) => { // 予定IDはselectedEventから取得

    // サーバーに削除リクエストを送信
    try {
      const response = await fetch(`${API_URL}/${eventId}`, {
        method: 'DELETE', // DELETEメソッドで送信
      });
      if (response.status !== 204) throw new Error('予定の削除に失敗しました。');

      fetchEvents(); // カレンダーを再読み込み
      closeModal(); // モーダルを閉じる
    } catch (err) {
      console.error("予定の削除に失敗しました:", err);
      setError("予定の削除に失敗しました。");
    }
  };

  // カレンダーの設定
  const calendarOptions = {
    // 使用するプラグイン
    plugins: [
      dayGridPlugin,  // 日表示・週表示プラグインを追加
      interactionPlugin, // クリック操作プラグインを追加
      timeGridPlugin  // 時間表示プラグインを追加
    ], 
    initialView: 'dayGridMonth', // 初期表示を月表示に設定

    // カレンダーの見た目と操作性の設定
    headerToolbar: {
      left: 'prev,next today', // 左側に前月・次月・今日ボタンを配置
      center: 'title', // 中央にタイトルを配置
      right: 'dayGridMonth,timeGridWeek,timeGridDay' // 右側に月・週・日表示切替ボタンを配置
    },

    // 言語設定
    locale: 'ja', // 日本語に設定
    
    weekends: true, // 土日を有効にする

    selectable: true, // 期間選択を有効にする

    // 予定データとしてステートを渡す
    // events: events,

    // 処理関数を渡す
    select: handleSelect, // 期間選択時の処理
    dateClick: handleDateClick,  // 日付クリック時の処理     
    eventClick: handleEventClick, // 予定クリック時の処理

    allDaySlot: true, // 終日スロットを表示

    slotMinTime: '00:00:00', // スロットの開始時刻を00:00に設定
    slotMaxTime: '24:00:00', // スロットの終了時刻を24:00に設定

    height: 'auto' // カレンダーの高さを自動調整
  };

  // --- JSX (描画部分) ---

  if (loading) { // 読み込み中はローディングメッセージを表示
    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <h1>📅 T-lab2025 共有カレンダー</h1>
            <p style={{ textAlign: 'center' }}>データ読み込み中...</p>
        </div>
    );
  }

  // モーダル関連のステート
  return ( /* 全体のコンテナ */
    <>
      <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
        <h1>📅 T-lab2025 共有カレンダー</h1>
        <p>（バックエンドAPIと通信しています。DB接続がない場合はローカルメモリに保存されます）</p>
        {error && <p style={{ color: 'red', textAlign: 'center' }}>エラー: {error}</p>}

        {/* --- 絞り込みフィルター --- */}
        <div className="filter-controls">
          <label htmlFor="person-filter">人物で絞り込む:</label>
          <select 
            id="person-filter" 
            value={selectedPerson} 
            onChange={(e) => setSelectedPerson(e.target.value)}
          >
            <option value="">すべて</option>
            {personList.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {/* --- FullCalendarコンポーネント --- */}
        <FullCalendar
         {...calendarOptions}
         events={events} // 絞り込み後のeventsステートを渡す
        />
      </div>

      {/* モーダルコンポーネント */}
      <EventModal
        isOpen={modalOpen} // モーダルの開閉状態
        onClose={closeModal} // モーダルを閉じる関数
        onSave={handleModalSave} // 予定保存関数
        onDelete={handleModalDelete} // 予定削除関数
        selectedDate={selectedDate} // 選択された日付
        selectedEvent={selectedEvent} // 選択された予定
      />
    </>
  )
}

export default App;