import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase/firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  limit,
} from 'firebase/firestore';

import '../../styles/ChatRoom.css';

const ChatRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [userName, setUserName] = useState('匿名');
  const [otherUserName, setOtherUserName] = useState('');
  const bottomRef = useRef(null);
  const [sending, setSending] = useState(false);

  // メッセージ取得＆既読処理（最大50件取得）
  useEffect(() => {
    if (!roomId || !currentUser) return;

    const q = query(
      collection(db, `chatRooms/${roomId}/messages`),
      orderBy('timestamp'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const msgData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(msgData);

      // 既読処理
      snapshot.docs.forEach(async (docSnap) => {
        const msg = docSnap.data();
        const isMyMessage = msg.uid === currentUser.uid;
        const hasRead = msg.readBy?.includes(currentUser.uid);

        if (!isMyMessage && !hasRead) {
          await updateDoc(docSnap.ref, {
            readBy: [...(msg.readBy || []), currentUser.uid],
          });
        }
      });
    });

    return () => unsubscribe();
  }, [roomId, currentUser]);

  // 自分のユーザー名を取得
  useEffect(() => {
    const fetchUsername = async () => {
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          // owner.username に対応
          setUserName(userSnap.data().owner?.username || '匿名');
        }
      }
    };
    fetchUsername();
  }, [currentUser]);

  // 相手の名前を取得
  useEffect(() => {
    const fetchOtherUserName = async () => {
      if (!roomId || !currentUser) return;

      const roomDocRef = doc(db, 'chatRooms', roomId);
      const roomSnap = await getDoc(roomDocRef);

      if (roomSnap.exists()) {
        const members = roomSnap.data().members || [];
        const otherUid = members.find((uid) => uid !== currentUser.uid);

        if (otherUid) {
          const userDocRef = doc(db, 'users', otherUid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            // owner.username に対応
            setOtherUserName(userSnap.data().owner?.username || '相手ユーザー');
          }
        }
      }
    };

    fetchOtherUserName();
  }, [roomId, currentUser]);

  // 新メッセージ時にスクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // メッセージ送信処理
  const handleSend = async () => {
    if (sending) return;
    if (!text.trim()) return;
    if (!currentUser) {
      alert('ログインが必要です');
      return;
    }

    setSending(true);
    try {
      await addDoc(collection(db, `chatRooms/${roomId}/messages`), {
        text,
        uid: currentUser.uid,
        displayName: userName,
        timestamp: serverTimestamp(),
        readBy: [currentUser.uid],
      });

      const roomDocRef = doc(db, 'chatRooms', roomId);
      await updateDoc(roomDocRef, {
        lastMessage: text,
        updatedAt: serverTimestamp(),
      });

      setText('');
    } catch (e) {
      alert('メッセージ送信に失敗しました');
    } finally {
      setSending(false);
    }
  };

  // メッセージを日付ごとにグループ化
  function groupMessagesByDate(messages) {
    const groups = {};

    messages.forEach((msg) => {
      if (!msg.timestamp?.seconds && !(msg.timestamp instanceof Date)) return;
      let dateObj;
      if (msg.timestamp?.seconds) {
        dateObj = new Date(msg.timestamp.seconds * 1000);
      } else if (msg.timestamp instanceof Date) {
        dateObj = msg.timestamp;
      } else {
        return;
      }
      const key = dateObj.toISOString().split('T')[0];
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(msg);
    });

    return Object.entries(groups).sort((a, b) => (a[0] > b[0] ? 1 : -1));
  }

  // 日付見出しの表示調整
  function formatDateHeader(dateString) {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const date = new Date(dateString);

    if (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    )
      return '今日';

    if (
      date.getFullYear() === yesterday.getFullYear() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getDate() === yesterday.getDate()
    )
      return '昨日';

    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="container-fluid d-flex flex-column p-0 bg-light" style={{ height: '100dvh' }}>
      {/* ヘッダー */}
      <div
        className="shadow-sm px-4 py-3 border-bottom d-flex align-items-center"
        style={{ flexShrink: 0 }}
      >
        <button
          className="btn Chat-btn2 border rounded-circle d-flex align-items-center justify-content-center me-3"
          style={{ width: '40px', height: '40px' }}
          onClick={() => navigate('/home/chat')}
          title="戻る"
          disabled={sending}
        >
          <i className="bi bi-arrow-left-short fs-4" />
        </button>
        <h5 className="mb-0">{otherUserName || '相手ユーザー'}</h5>
      </div>

      {/* メッセージエリア */}
      <div
        className="flex-grow-1 overflow-auto px-3 py-3"
        style={{ minHeight: 0, backgroundColor: '#faf7ee' }}
      >
        {groupedMessages.map(([dateKey, msgs]) => (
          <div key={dateKey} className="mb-4">
            <div className="text-center text-muted mb-3">{formatDateHeader(dateKey)}</div>
            {msgs.map((msg) => {
              const isMyMessage = msg.uid === currentUser?.uid;
              const time = msg.timestamp?.toDate
                ? msg.timestamp.toDate().toLocaleTimeString('ja-JP', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
                : msg.timestamp instanceof Date
                  ? msg.timestamp.toLocaleTimeString('ja-JP', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  : '';

              return (
                <div
                  key={msg.id}
                  className={`d-flex mb-2 ${isMyMessage ? 'justify-content-end' : 'justify-content-start'
                    }`}
                >
                  {!isMyMessage ? (
                    <div className="d-flex mb-2">
                      <div className="me-2" style={{ width: 40, flexShrink: 0 }}>
                        <i className="bi bi-person-circle fs-3" style={{ color: '#4f4f4fff' }}></i>
                      </div>
                      <div>
                        <div
                          className="rounded-4 shadow-sm px-3 py-2 chat-bubble"
                          style={{
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            marginTop: 5,
                            maxWidth: '60vw',
                            backgroundColor: '#faf7ee',
                            color: '#573939ff',
                            fontweight: 'bold',
                          }}
                        >
                          {msg.text}
                        </div>
                        <div
                          className="text-muted small chat-time"
                          style={{ fontSize: '0.7rem', marginTop: 2, marginLeft: 8 }}
                        >
                          {time}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-end">
                      <div
                        className="rounded-4 shadow-sm text-white px-3 py-2 chat-bubble"
                        style={{
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          maxWidth: '60vw',
                          backgroundColor: '#ff6f61',
                          color: '#FFFFFF',
                        }}
                      >
                        {msg.text}
                      </div>
                      <div
                        className="text-muted small chat-time"
                        style={{ fontSize: '0.7rem', marginTop: 2, marginLeft: 4 }}
                      >
                        {time}
                      </div>
                      <div
                        className="text-muted small"
                        style={{ fontSize: '0.7rem', marginLeft: 4 }}
                      >
                        {msg.readBy?.length > 1 ? '既読' : '未読'}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 入力欄 */}
      <div className="px-3 py-2 border-top bg-light" style={{ flexShrink: 0 }}>
        <div className="d-flex gap-2">
          <input
            type="text"
            className="form-control rounded-pill"
            placeholder="メッセージを入力"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (!sending) handleSend();
              }
            }}
            style={{ flexGrow: 1, minWidth: 0 }}
            disabled={sending}
          />
          <button
            className="btn Chat-btn btn-success rounded-pill d-flex align-items-center justify-content-center"
            onClick={handleSend}
            style={{ minWidth: '70px', padding: '0 16px' }}
            aria-label="送信"
            disabled={sending}
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
