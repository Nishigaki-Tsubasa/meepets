import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebase/firebase";
import { format } from "date-fns";
import ja from "date-fns/locale/ja";
import { FaHeart, FaRegHeart } from "react-icons/fa";

const WalkDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate(); // 戻るボタン用
    const [walk, setWalk] = useState(null);
    const [loading, setLoading] = useState(true);
    const auth = getAuth();

    useEffect(() => {
        const fetchWalk = async () => {
            try {
                const walkDoc = await getDoc(doc(db, "walkRequests", id));
                if (walkDoc.exists()) {
                    setWalk({ id: walkDoc.id, ...walkDoc.data() });
                } else {
                    console.log("投稿が存在しません");
                }
            } catch (err) {
                console.error("投稿取得エラー:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchWalk();
    }, [id]);

    const handleLike = async () => {
        if (!auth.currentUser) return alert("ログインが必要です");
        const ref = doc(db, "walkRequests", id);

        try {
            if (walk.likes?.includes(auth.currentUser.uid)) {
                await updateDoc(ref, { likes: arrayRemove(auth.currentUser.uid) });
                setWalk((prev) => ({
                    ...prev,
                    likes: prev.likes.filter((uid) => uid !== auth.currentUser.uid),
                }));
            } else {
                await updateDoc(ref, { likes: arrayUnion(auth.currentUser.uid) });
                setWalk((prev) => ({
                    ...prev,
                    likes: [...(prev.likes || []), auth.currentUser.uid],
                }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <p className="text-center mt-5">読み込み中...</p>;
    if (!walk) return <p className="text-center mt-5">投稿が見つかりません</p>;

    const postTime = walk.createdAt?.toDate
        ? format(walk.createdAt.toDate(), "MM/dd HH:mm", { locale: ja })
        : walk.createdAt
            ? format(new Date(walk.createdAt), "MM/dd HH:mm", { locale: ja })
            : "";

    const walkTime = walk.datetime?.toDate
        ? format(walk.datetime.toDate(), "MM/dd HH:mm", { locale: ja })
        : walk.datetime
            ? format(new Date(walk.datetime), "MM/dd HH:mm", { locale: ja })
            : "日時未設定";

    const isLiked = walk.likes?.includes(auth.currentUser?.uid);

    return (
        <div style={{ backgroundColor: "#fdfcf7", minHeight: "100vh", padding: "1rem" }}>
            {/* 戻るボタン */}
            <button
                onClick={() => navigate(-1)}
                style={{
                    borderRadius: "1rem",
                    border: "1px solid #ccc",
                    background: "#fff",
                    padding: "0.5rem 1rem",
                    marginBottom: "1rem",
                    cursor: "pointer",
                }}
            >
                ← 戻る
            </button>

            {/* 投稿カード */}
            <div style={{
                backgroundColor: "#fffef9",
                borderRadius: "1rem",
                padding: "2rem",
                boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                maxWidth: "700px",
                margin: "0 auto 2rem auto"
            }}>
                {/* ヘッダー */}
                <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#5a452e", marginBottom: "0.2rem" }}>
                        {walk.title}
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#888" }}>投稿日時: {postTime}</div>
                </div>

                {/* ペット画像 */}
                {walk.pet?.image && (
                    <img
                        src={walk.pet.image}
                        alt="ペット"
                        style={{
                            width: "120px",
                            height: "120px",
                            borderRadius: "1rem",
                            objectFit: "cover",
                            border: "1px solid #ddd",
                            marginBottom: "1rem"
                        }}
                    />
                )}

                {/* 詳細 */}
                <div style={{
                    background: "#fffaf3",
                    borderRadius: "1rem",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                    padding: "1rem",
                    marginBottom: "1rem"
                }}>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#555", marginBottom: "0.2rem" }}>場所</div>
                        <div style={{ fontWeight: 500, fontSize: "0.95rem", color: "#333" }}>{walk.prefecture} {walk.location}</div>
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#555", marginBottom: "0.2rem" }}>日時</div>
                        <div style={{ fontWeight: 500, fontSize: "0.95rem", color: "#333" }}>{walkTime}</div>
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#555", marginBottom: "0.2rem" }}>ペット</div>
                        <div style={{ fontWeight: 500, fontSize: "0.95rem", color: "#333" }}>{walk.pet?.breed} 「{walk.pet?.name}」</div>
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#555", marginBottom: "0.2rem" }}>年齢/性別</div>
                        <div style={{ fontWeight: 500, fontSize: "0.95rem", color: "#333" }}>
                            {walk.pet?.age}歳 / {walk.pet?.gender === "female" ? "メス" : walk.pet?.gender === "male" ? "オス" : "不明"}
                        </div>
                    </div>
                </div>

                {/* 投稿内容 */}
                <div style={{
                    background: "#fff",
                    padding: "1rem",
                    borderRadius: "1rem",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                    marginBottom: "1rem",
                    whiteSpace: "pre-line",
                    color: "#555"
                }}>
                    {walk.content}
                </div>

                {/* いいねボタン */}
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>

                    <button
                        onClick={handleLike}
                        style={{
                            borderRadius: "1rem",
                            border: "none",
                            background: "#fff",
                            padding: "0.5rem 1rem",
                            display: "flex",
                            alignItems: "center",
                            cursor: "pointer",
                            color: isLiked ? "#ff6f61" : "#999"
                        }}
                    >
                        {isLiked ? <FaHeart style={{ marginRight: "0.3rem" }} /> : <FaRegHeart style={{ marginRight: "0.3rem" }} />}
                        {walk.likes?.length || 0} いいね
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WalkDetail;
