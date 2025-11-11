import React, { useEffect, useState } from 'react';
import {
    collection, query, where, orderBy, onSnapshot,
    doc, getDoc, getDocs, limit
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../../firebase/firebase';
import { useNavigate } from 'react-router-dom';
import '../../styles/ChatList.css'; // ← 追加

const ChatList = () => {
    const [chatRooms, setChatRooms] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [userMap, setUserMap] = useState({});
    const [loading, setLoading] = useState(true); // ← 追加
    const navigate = useNavigate();

    useEffect(() => {
        const auth = getAuth();
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setCurrentUserId(user ? user.uid : null);
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!currentUserId) return;

        const q = query(
            collection(db, 'chatRooms'),
            where('members', 'array-contains', currentUserId),
            orderBy('updatedAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            setLoading(true); // ← 追加

            const rooms = [];
            const userMapTemp = { ...userMap };

            await Promise.all(snapshot.docs.map(async (docSnap) => {
                const room = { id: docSnap.id, ...docSnap.data() };
                const otherUid = room.members.find(uid => uid !== currentUserId);

                // ユーザー名取得（キャッシュ）
                if (!userMapTemp[otherUid]) {
                    const userDoc = await getDoc(doc(db, 'users', otherUid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        userMapTemp[otherUid] =
                            data.owner?.username || data.username || data.displayName || '相手ユーザー';
                    } else {
                        userMapTemp[otherUid] = '相手ユーザー';
                    }
                }


                room.otherUserName = userMapTemp[otherUid];

                // 🔽 未読メッセージ取得（最新20件のみ）
                const messageQuery = query(
                    collection(db, `chatRooms/${room.id}/messages`),
                    orderBy('timestamp', 'desc'),
                    limit(20)
                );
                const messageSnap = await getDocs(messageQuery);

                let unreadCount = 0;
                let isUnread = false;

                messageSnap.forEach(doc => {
                    const msg = doc.data();
                    if (msg.uid !== currentUserId && !(msg.readBy?.includes(currentUserId))) {
                        unreadCount++;
                        isUnread = true;
                    }
                });

                room.unreadCount = unreadCount;
                room.unread = { [currentUserId]: isUnread };

                rooms.push(room);
            }));

            setUserMap(userMapTemp);
            setChatRooms(rooms);
            setLoading(false); // ← 追加
        });

        return () => unsubscribe();
    }, [currentUserId]);

    if (!currentUserId) return <p className="text-center mt-4">ログインしてください</p>;

    return (
        <div className="container py-3">
            <h2 className="mb-4">トーク</h2>
            {loading ? (
                <p>読み込み中...</p>
            ) : chatRooms.length === 0 ? (
                <p>まだチャットはありません。</p>
            ) : (
                <ul className="list-group">
                    {chatRooms.map((room) => {
                        const isUnread = room.unread?.[currentUserId];
                        return (
                            <li
                                key={room.id}
                                className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${isUnread ? 'bg-light' : ''}`}
                                onClick={() => navigate(`/home/chat/${room.id}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="d-flex align-items-center">
                                    <div className="me-1" style={{ width: '40px', flexShrink: 0 }}>
                                        <i className="bi bi-person-circle fs-3" style={{ color: '#ff6f61' }}></i>
                                    </div>
                                    <div className="d-flex flex-column justify-content-center">
                                        <strong className="mb-1">{room.otherUserName}</strong>
                                        <small className="text-muted last-message">{room.lastMessage || 'メッセージなし'}</small>
                                    </div>
                                </div>
                                <div className="text-end">
                                    <small className="text-muted d-block">
                                        {room.updatedAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </small>
                                    {isUnread && (
                                        <span className="badge bg-danger mt-1">
                                            {room.unreadCount}件
                                        </span>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default ChatList;
