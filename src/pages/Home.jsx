import React, { useState, useEffect } from "react";
import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

import EditProfile from "../components/EditProfile";
import MealRegistrationForm from "../components/MealRegistrationForm";
import MealList from "../components/MealList";
import MatchingsRequests from "../components/MatchingsRequests";
import Matching from "../components/MyMatchedParticipations";
import MatchingDetail from "../components/MatchingDetail";
import HomeComponents from "../components/HomeComponents";
import UserProfilePage from "../components/UserProfilePage";
import ChatList from "../components/chatComponets/ChatList";
import ChatRoom from "../components/chatComponets/ChatRoom";
import ChatStart from "../components/chatComponets/ChatStart";
import JitsiMeet from "../components/JitsiMeet";
import Notifications from "../components/Notifications";
import WalkRequestForm from "../components/WalkRequestForm";
import WalkList from "../components/WalkList";
import MyWalkRequests from "../components/MyWalkRequests";
import AdoptionBoard from "../components/AdoptionBoard";
import AdoptionForm from "../components/AdoptionForm";
import WalkDetail from "../components/WalkDetail";

import colors from "../colors";
import "../styles/Home.css";

function Home() {
    const navigate = useNavigate();
    const [username, setUsername] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // ユーザー情報取得
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userDocRef = doc(db, "users", user.uid);
                    const snap = await getDoc(userDocRef);
                    if (snap.exists()) {
                        const data = snap.data();
                        const displayName = data.owner?.username || data.displayName || "名無し";
                        setUsername(displayName);
                    } else setUsername("名無し");
                } catch {
                    setUsername("名無し");
                }
            } else setUsername(null);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/");
        } catch (err) {
            console.error("ログアウト失敗:", err);
        }
    };

    const menuItems = [
        { to: "/home/", icon: "bi-house-door", label: "ホーム" },
        { to: "/home/WalkList", icon: "bi-bell", label: "散歩掲示板" },
        { to: "/home/chat", icon: "bi-chat-dots", label: "チャット" },
        { to: "/home/AdoptionBoard", icon: "bi-paw", label: "里親募集" },
    ];

    return (
        <div style={{ backgroundColor: colors.mainBg, minHeight: "100vh" }}>
            {/* ナビバー */}
            <nav
                className="navbar fixed-top d-flex align-items-center justify-content-between px-4"
                style={{
                    backgroundColor: "#ffffff",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.08)",
                    height: 70,
                    zIndex: 1000,
                    fontFamily: "Arial, sans-serif",
                    borderBottomLeftRadius: 10,
                    borderBottomRightRadius: 10,
                }}
            >
                {/* 左側：ロゴ + メニュー */}
                <div className="d-flex align-items-center gap-4">
                    {/* ロゴ */}
                    <div
                        className="d-flex align-items-center"
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate("/home/")}
                    >
                        <img
                            src="/favicon.ico"
                            alt="App Icon"
                            style={{ width: 40, height: 40, objectFit: "cover", marginRight: 8 }}
                        />
                        <span style={{ fontWeight: "700", fontSize: "1.3rem", color: "#ff6f61" }}>meeple</span>
                    </div>

                    {/* メニュー項目（PC用） */}
                    <ul className="navbar-nav d-none d-md-flex flex-row gap-3 mb-0">
                        {menuItems.map(({ to, icon, label }) => (
                            <li key={to} className="nav-item">
                                <NavLink
                                    to={to}
                                    end
                                    className={({ isActive }) =>
                                        `d-flex align-items-center px-3 py-2 rounded text-decoration-none ${isActive ? "fw-bold text-primary" : "text-muted hover-effect"
                                        }`
                                    }
                                >
                                    <i className={`bi ${icon} me-1`}></i>
                                    {label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 右側：プロフィール + ログアウト */}
                <div className="d-flex align-items-center gap-2 position-relative">
                    {/* ハンバーガー（モバイル） */}
                    <button
                        className="navbar-toggler d-md-none"
                        type="button"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        style={{ border: "none", background: "none", fontSize: "1.5rem", cursor: "pointer" }}
                    >
                        <i className="bi bi-list"></i>
                    </button>

                    {/* プロフィール + ドロップダウン */}
                    <div className="dropdown">
                        <button
                            className="btn p-1"
                            style={{ border: "none", background: "none" }}
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            <i className="bi bi-person-circle fs-4 text-primary"></i>
                        </button>
                        {isDropdownOpen && (
                            <ul
                                className="dropdown-menu dropdown-menu-end show"
                                style={{
                                    position: "absolute",
                                    top: "50px",
                                    right: 0,
                                    display: "block",
                                    margin: 0,
                                    padding: "5px 0",
                                    borderRadius: "8px",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                    backgroundColor: "#fff",
                                    zIndex: 1000,
                                }}
                            >
                                <li>
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            navigate("/home/EditProfile");
                                            setIsDropdownOpen(false);
                                        }}
                                    >
                                        プロフィール
                                    </button>
                                </li>
                                <li>
                                    <hr className="dropdown-divider" />
                                </li>
                                <li>
                                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                                        ログアウト
                                    </button>
                                </li>
                            </ul>
                        )}
                    </div>
                </div>

                {/* モバイルメニュー */}
                {isMenuOpen && (
                    <div
                        className="d-md-none"
                        style={{
                            position: "absolute",
                            top: 70,
                            left: 0,
                            width: "100%",
                            backgroundColor: "#fff",
                            boxShadow: "0 4px 8px rgba(0,0,0,0.08)",
                            borderBottomLeftRadius: 10,
                            borderBottomRightRadius: 10,
                            padding: "10px 0",
                            zIndex: 999,
                        }}
                    >
                        <ul className="navbar-nav d-flex flex-column gap-2 mb-0 px-2">
                            {menuItems.map(({ to, icon, label }) => (
                                <li key={to} className="nav-item">
                                    <NavLink
                                        to={to}
                                        end
                                        className={({ isActive }) =>
                                            `d-flex align-items-center px-3 py-2 rounded text-decoration-none ${isActive ? "fw-bold text-primary" : "text-muted hover-effect"
                                            }`
                                        }
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <i className={`bi ${icon} me-1`}></i>
                                        {label}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </nav>

            {/* メインコンテンツ */}
            <main
                style={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    overflow: "auto",
                    padding: "70px 20px 20px 20px", // 上部70pxでナビバー分を空ける
                }}
            >
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
                    <Route path="/AdoptionBoard" element={<AdoptionBoard />} />
                    <Route path="/AdoptionForm" element={<AdoptionForm />} />
                    <Route path="/walkDetail/:id" element={<WalkDetail />} />
                </Routes>
            </main>


            {/* CSS for hover effect */}
            <style>
                {`
          .hover-effect:hover {
            color: #ff6f61 !important;
            transform: translateY(-2px);
          }
        `}
            </style>
        </div>
    );
}

export default Home;
