import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

import EditProfile from '../components/EditProfile';
import MealRegistrationForm from '../components/MealRegistrationForm';
import MealList from '../components/MealList';
import MatchingsRequests from '../components/MatchingsRequests';
import Matching from '../components/MyMatchedParticipations';
import MatchingDetail from '../components/MatchingDetail';
import HomeComponents from '../components/HomeComponents';
import UserProfilePage from '../components/UserProfilePage';
import ChatList from '../components/chatComponets/ChatList';
import ChatRoom from '../components/chatComponets/ChatRoom';
import ChatStart from '../components/chatComponets/ChatStart';
import JitsiMeet from '../components/JitsiMeet';
import Notifications from '../components/Notifications';
import WalkRequestForm from '../components/WalkRequestForm';
import WalkList from '../components/WalkList';
import MyWalkRequests from '../components/MyWalkRequests';

import colors from '../colors';
import '../styles/Home.css';

function Home() {
    const navigate = useNavigate();
    const [username, setUsername] = useState(null);

    // PCとスマホ用の状態を分ける
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [sidebarOpenPC, setSidebarOpenPC] = useState(true);
    const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
    const [hovered, setHovered] = useState(false);

    const sidebarWidthOpen = 250;
    const sidebarWidthClosed = 70;

    // リサイズ判定
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ユーザー情報取得
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const uid = user.uid;

                try {
                    const userDocRef = doc(db, 'users', uid);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                        const data = userDocSnap.data();
                        console.log('Firestore user data:', data);

                        // ✅ displayNameを優先して表示。なければowner.usernameを使用
                        const displayName = data.owner?.username || data.displayName || '名無し';
                        setUsername(displayName);
                    } else {
                        setUsername('名無し');
                    }
                } catch (error) {
                    console.error('ユーザー情報の取得に失敗しました:', error);
                    setUsername('名無し');
                }
            } else {
                setUsername(null);
            }
        });
        return () => unsubscribe();
    }, []);

    // ログアウト処理
    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (err) {
            console.error('ログアウト失敗：', err);
        }
    };

    const menuItems = [
        { to: '/home/', icon: 'bi-house-door', label: 'ホーム' },
        { to: '/home/mealList', icon: 'bi-pencil-square', label: '掲示板' },
        { to: '/home/matchingsRequests', icon: 'bi-envelope', label: '食事リクエスト' },
        { to: '/home/matching', icon: 'bi-people', label: 'マッチング済み' },
        { to: '/home/chat', icon: 'bi-chat-dots', label: 'チャット' },
        { to: '/home/WalkList', icon: 'bi-bell', label: '散歩掲示板' },
        { to: '/home/MyWalkRequests', icon: 'bi-bell', label: 'マイ散歩リクエスト' },
    ];

    // モバイルクリック時に閉じる
    const handleMobileClick = () => {
        if (isMobile) setSidebarOpenMobile(false);
    };

    return (
        <div
            className="d-flex flex-column flex-md-row"
            style={{ minHeight: '100vh', backgroundColor: colors.mainBg, color: colors.text }}
        >
            {/* モバイル時ヘッダー */}
            {isMobile && (
                <header
                    className="d-flex align-items-center justify-content-between px-3 py-3 border-bottom"
                    style={{ backgroundColor: colors.subBg, minHeight: 70 }}
                >
                    <button
                        onClick={() => setSidebarOpenMobile(true)}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            margin: 0,
                            cursor: 'pointer',
                            color: 'inherit',
                        }}
                    >
                        <i className="bi bi-list fs-4"></i>
                    </button>

                    <div className="d-flex align-items-center">
                        <img
                            src="/favicon.ico"
                            alt="App Icon"
                            style={{ width: 40, height: 40, objectFit: 'cover', marginRight: 8 }}
                        />
                        <span style={{ fontWeight: '600', fontSize: '1.2rem', color: '#ff6f61' }}>meeple</span>
                    </div>

                    <div style={{ width: 40 }}></div>
                </header>
            )}

            {/* サイドバー */}
            <nav
                className="sidebar d-flex flex-column px-2 py-3 border-end"
                style={{
                    width: isMobile
                        ? sidebarWidthOpen
                        : sidebarOpenPC
                            ? sidebarWidthOpen
                            : sidebarWidthClosed,
                    backgroundColor: colors.subBg,
                    transition: 'transform 0.3s, width 0.3s',
                    transform: isMobile
                        ? sidebarOpenMobile
                            ? 'translateX(0)'
                            : 'translateX(-100%)'
                        : 'translateX(0)',
                    overflow: 'hidden',
                    position: isMobile ? 'absolute' : 'relative',
                    zIndex: 1000,
                    height: '100%',
                }}
            >
                {/* 上部ボタン */}
                {isMobile ? (
                    <div className="d-flex justify-content-end mb-3">
                        <button
                            onClick={() => setSidebarOpenMobile(false)}
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                margin: 0,
                                cursor: 'pointer',
                                color: 'inherit',
                            }}
                        >
                            <i className="bi bi-x-lg fs-4"></i>
                        </button>
                    </div>
                ) : (
                    <div className="d-flex w-100 mb-3 align-items-center">
                        {sidebarOpenPC ? (
                            <>
                                <img
                                    src="/favicon.ico"
                                    alt="App Icon"
                                    style={{ width: 40, height: 40, objectFit: 'cover', marginLeft: 8 }}
                                />
                                <div className="flex-grow-1"></div>
                                <button
                                    className="my-btn"
                                    onClick={() => setSidebarOpenPC(false)}
                                    style={{
                                        width: 40,
                                        height: 40,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: 8,
                                    }}
                                >
                                    <i className="bi bi-chevron-left"></i>
                                </button>
                            </>
                        ) : (
                            <div
                                style={{ width: 40, height: 40, margin: '0 auto' }}
                                onMouseEnter={() => setHovered(true)}
                                onMouseLeave={() => setHovered(false)}
                            >
                                {!hovered ? (
                                    <img
                                        src="/favicon.ico"
                                        alt="App Icon"
                                        style={{
                                            width: 40,
                                            height: 40,
                                            objectFit: 'cover',
                                            cursor: 'pointer',
                                        }}
                                    />
                                ) : (
                                    <button
                                        className="my-btn"
                                        style={{
                                            width: 40,
                                            height: 40,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                        onClick={() => setSidebarOpenPC(true)}
                                    >
                                        <i className="bi bi-chevron-right"></i>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* プロフィール */}
                <div
                    className="card mb-4 w-100"
                    style={{ backgroundColor: colors.mainBg, border: 'none' }}
                >
                    <div
                        className="card-body d-flex align-items-center"
                        onClick={() => {
                            navigate('/home/EditProfile');
                            handleMobileClick();
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        <i
                            className="bi bi-person-circle fs-3 me-2"
                            style={{ color: colors.accentBg, userSelect: 'none' }}
                        ></i>
                        {(isMobile ? sidebarOpenMobile : sidebarOpenPC) && (
                            <div>
                                <div className="small text-muted" style={{ userSelect: 'none' }}>
                                    ようこそ、
                                </div>
                                <div
                                    className="fw-bold text-dark text-truncate"
                                    style={{ maxWidth: 150, userSelect: 'none' }}
                                >
                                    {username ? username : '読み込み中...'}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* メニュー */}
                <ul className="nav nav-pills flex-column w-100">
                    {menuItems.map(({ to, icon, label }) => (
                        <li key={to} className="nav-item">
                            <NavLink
                                to={to}
                                end
                                onClick={handleMobileClick}
                                className={({ isActive }) =>
                                    `nav-link sidebarLink d-flex align-items-center ${isActive ? 'active' : ''
                                    }`
                                }
                            >
                                <i className={`bi ${icon} fs-5`}></i>
                                {(isMobile ? sidebarOpenMobile : sidebarOpenPC) && (
                                    <span className="ms-2">{label}</span>
                                )}
                            </NavLink>
                        </li>
                    ))}
                </ul>

                {/* ログアウトボタン */}
                <button
                    onClick={() => {
                        handleLogout();
                        handleMobileClick();
                    }}
                    className="btn btn-danger w-100 mt-auto d-flex align-items-center justify-content-center"
                >
                    <i className="bi bi-box-arrow-right"></i>
                    {(isMobile ? sidebarOpenMobile : sidebarOpenPC) && (
                        <span className="ms-2">ログアウト</span>
                    )}
                </button>
            </nav>

            {/* メインコンテンツ */}
            <main className="flex-grow-1 px-3 py-4" style={{ transition: 'margin 0.3s' }}>
                <Routes>
                    <Route path="*" element={<HomeComponents />} />
                    <Route path="new-request" element={<MealRegistrationForm />} />
                    <Route path="mealList" element={<MealList />} />
                    <Route path="matchingsRequests" element={<MatchingsRequests />} />
                    <Route path="matching" element={<Matching />} />
                    <Route path="matching/:requestId" element={<MatchingDetail />} />
                    <Route path="profile/:uid" element={<UserProfilePage />} />
                    <Route path="chat" element={<ChatList />} />
                    <Route path="/chat/:roomId" element={<ChatRoom />} />
                    <Route path="/chatStart/:userId" element={<ChatStart />} />
                    <Route path="/jitsi/:roomId" element={<JitsiMeet />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/EditProfile" element={<EditProfile />} />
                    <Route path="/walkRequest" element={<WalkRequestForm />} />
                    <Route path="/WalkList" element={<WalkList />} />
                    <Route path="/MyWalkRequests" element={<MyWalkRequests />} />
                </Routes>
            </main>
        </div>
    );
}

export default Home;
