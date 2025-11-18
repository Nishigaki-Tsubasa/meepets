import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/firebase";
import WalkCard from "./WalkCard";

const HomeComponents = () => {
    const auth = getAuth();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [myWalks, setMyWalks] = useState([]);
    const [latestWalks, setLatestWalks] = useState([]);
    const [loading, setLoading] = useState(true);

    // 色コードを直接定義
    const mainBg = "#fdfcf7";
    const subBg = "#faf7ee";
    const accentBg = "#ff6f61";
    const sidebarText = "#333333";
    const sidebarFont = "M PLUS Rounded 1c";
    const sidebarFontWeight = "bold";
    const buttonText = "#FFFFFF";
    const hoverBg = "#e0e0e0";
    const hoverText = "#000000";

    useEffect(() => {
        const fetchData = async () => {
            const user = auth.currentUser;
            if (!user) return;

            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) setUserData(userDoc.data());

            const snap = await getDocs(collection(db, "walkRequests"));
            const allWalks = [];
            const now = new Date();

            for (const docSnap of snap.docs) {
                const data = docSnap.data();
                const ownerSnap = await getDoc(doc(db, "users", data.uid));
                allWalks.push({
                    id: docSnap.id,
                    ...data,
                    owner: ownerSnap.exists() ? ownerSnap.data() : {},
                });
            }

            setMyWalks(
                allWalks
                    .filter((w) => w.uid === user.uid && w.datetime?.toDate() > now)
                    .sort((a, b) => a.datetime.toDate() - b.datetime.toDate())
            );

            setLatestWalks(
                allWalks
                    .filter((w) => w.uid !== user.uid && w.datetime?.toDate() > now)
                    .sort((a, b) => a.datetime.toDate() - b.datetime.toDate())
                    .slice(0, 5)
            );

            setLoading(false);
        };
        fetchData();
    }, []);

    if (!auth.currentUser) return <p>ログインしてください</p>;
    if (loading || !userData) return <p>読み込み中...</p>;

    // シンプルなセクション枠
    const sectionStyle = {
        background: subBg,
        padding: "1rem",
        border: "1px solid #ddd",
        borderRadius: "8px",
        marginBottom: "1.5rem",
        color: sidebarText,
        fontFamily: sidebarFont,
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                padding: "1.5rem",
                background: mainBg,
                fontFamily: sidebarFont,
                color: sidebarText,
            }}
        >
            {/* ヘッダー */}
            <div style={{ ...sectionStyle, textAlign: "center" }}>
                <h2 style={{ marginBottom: "1rem", fontWeight: sidebarFontWeight }}>
                    今日のお散歩を投稿しよう
                </h2>

                <button
                    style={{
                        padding: "0.6rem 1rem",
                        background: accentBg,
                        color: buttonText,
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontFamily: sidebarFont,
                        fontWeight: "bold",
                    }}
                    onClick={() => navigate("/home/walkRequest")}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                    お散歩を登録する
                </button>
            </div>

            {/* 自分の散歩 */}
            <div style={sectionStyle}>
                <h3 style={{ marginBottom: "1rem", fontWeight: "bold" }}>
                    自分の散歩予定
                </h3>

                {myWalks.length === 0 ? (
                    <p>まだ散歩の予定がありません。</p>
                ) : (
                    myWalks.map((walk) => <WalkCard key={walk.id} walk={walk} />)
                )}
            </div>

            {/* おすすめ散歩 */}
            <div style={sectionStyle}>
                <h3 style={{ marginBottom: "1rem", fontWeight: "bold" }}>
                    おすすめ散歩
                </h3>

                {latestWalks.length === 0 ? (
                    <p>投稿がありません</p>
                ) : (
                    latestWalks.map((walk) => <WalkCard key={walk.id} walk={walk} />)
                )}

                {latestWalks.length >= 5 && (
                    <button
                        style={{
                            marginTop: "0.75rem",
                            padding: "0.5rem 1rem",
                            background: subBg,
                            border: "1px solid #ccc",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontFamily: sidebarFont,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = hoverBg;
                            e.currentTarget.style.color = hoverText;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = subBg;
                            e.currentTarget.style.color = sidebarText;
                        }}
                        onClick={() => navigate("/home/walkList")}
                    >
                        もっと見る
                    </button>
                )}
            </div>

            {/* 右下の追加ボタン */}
            <button
                style={{
                    position: "fixed",
                    bottom: "1.5rem",
                    right: "1.5rem",
                    width: "3rem",
                    height: "3rem",
                    borderRadius: "50%",
                    background: accentBg,
                    color: buttonText,
                    border: "none",
                    fontSize: "1.6rem",
                    cursor: "pointer",
                    fontWeight: "bold",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                onClick={() => navigate("/home/walkRequest")}
            >
                +
            </button>
        </div>
    );
};

export default HomeComponents;
