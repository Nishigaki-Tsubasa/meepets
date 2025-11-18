import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { getAuth } from 'firebase/auth';
import { FaArrowLeft } from 'react-icons/fa';

const JitsiMeet = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const jitsiContainerRef = useRef(null);
    const [profile, setProfile] = useState(null);
    const auth = getAuth();

    const handleBack = () => navigate(-1);

    useEffect(() => {
        const fetchProfile = async () => {
            const uid = auth.currentUser?.uid;
            if (!uid) return setProfile(null);

            try {
                const docRef = doc(db, 'users', uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setProfile(docSnap.data());
                } else {
                    setProfile(null);
                }
            } catch (error) {
                console.error('プロフィール取得エラー:', error);
            }
        };
        fetchProfile();
    }, [auth.currentUser]);

    useEffect(() => {
        if (!window.JitsiMeetExternalAPI || !profile) return;

        const domain = 'meet.jit.si';
        const options = {
            roomName: roomId,
            parentNode: jitsiContainerRef.current,
            userInfo: { displayName: profile.username || 'ゲスト' },
            interfaceConfigOverwrite: {
                TOOLBAR_BUTTONS: ['microphone', 'camera', 'chat', 'hangup'],
                SHOW_JITSI_WATERMARK: false,
                SHOW_WATERMARK_FOR_GUESTS: false,
                DEFAULT_REMOTE_DISPLAY_NAME: '参加者',
                TOOLBAR_ALWAYS_VISIBLE: true,
                APP_NAME: 'MealMatch',
            },
            configOverwrite: {
                disableDeepLinking: true,
                enableWelcomePage: false,
                prejoinPageEnabled: true,
                startWithAudioMuted: true,
                startWithVideoMuted: false,
                defaultLanguage: 'ja',
            },
        };

        const api = new window.JitsiMeetExternalAPI(domain, options);

        return () => api.dispose();
    }, [roomId, profile]);

    return (
        <div className="container my-4">
            <button className="btn btn-outline-secondary mb-3" onClick={handleBack}>
                <FaArrowLeft className="me-1" /> 戻る
            </button>

            <div
                ref={jitsiContainerRef}
                style={{
                    width: '100%',
                    height: '80vh',
                    borderRadius: 8,
                    overflow: 'hidden',
                    boxShadow: '0 0 15px rgba(0,0,0,0.2)',
                }}
            />
        </div>
    );
};

export default JitsiMeet;
