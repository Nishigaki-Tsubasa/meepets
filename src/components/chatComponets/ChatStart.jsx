import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';


const ChatStart = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  const hasRun = useRef(false); // 🔑 実行フラグ
  const jitsiRoomId = uuidv4();


  useEffect(() => {
    if (hasRun.current) return; // すでに実行済みなら何もしない
    hasRun.current = true;

    const createOrGetChatRoom = async () => {
      if (!currentUser) {
        alert('ログインしてください');
        navigate('/login');
        return;
      }

      if (!userId) {
        alert('チャット相手が指定されていません');
        return;
      }

      if (userId === currentUser.uid) {
        alert('自分自身とチャットはできません');
        return;
      }

      const q = query(
        collection(db, 'chatRooms'),
        where('members', 'array-contains', currentUser.uid)
      );
      const snapshot = await getDocs(q);

      const existingRoomDoc = snapshot.docs.find(doc => {
        const members = doc.data().members;
        return members.includes(userId);
      });

      if (existingRoomDoc) {
        navigate(`/home/chat/${existingRoomDoc.id}`);
        return;
      }


      const newRoomRef = await addDoc(collection(db, 'chatRooms'), {
        members: [currentUser.uid, userId].sort(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: '',
        jitsiRoomId: jitsiRoomId,
      });

      navigate(`/home/chat/${newRoomRef.id}`);
    };

    createOrGetChatRoom();
  }, [currentUser, userId, navigate]);

  return <p>チャットルームを作成中...</p>;
};

export default ChatStart;
