import React, { useEffect, useState } from "react";
import {
    collection,
    onSnapshot,
    updateDoc,
    doc,
    arrayUnion,
    arrayRemove,
    getDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebase/firebase";
import { format } from "date-fns";
import ja from "date-fns/locale/ja";
import { useNavigate } from "react-router-dom";
import { FaPaw, FaPlus, FaHeart, FaRegHeart, FaCommentDots } from "react-icons/fa";

const WalkList = () => {
    const [walks, setWalks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedArea, setSelectedArea] = useState("");
    const auth = getAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                setWalks([]);
                setLoading(false);
                return;
            }

            const unsubscribeSnapshot = onSnapshot(
                collection(db, "walkRequests"),
                async (snapshot) => {
                    const now = new Date();
                    const walkDocs = snapshot.docs
                        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
                        .filter((walk) => walk.uid !== auth.currentUser?.uid)
                        .filter(
                            (walk) =>
                                walk.datetime &&
                                typeof walk.datetime.toDate === "function" &&
                                walk.datetime.toDate() > now
                        )
                        .sort((a, b) => a.datetime.toDate() - b.datetime.toDate());

                    const walkData = await Promise.all(
                        walkDocs.map(async (walk) => {
                            try {
                                const userDocSnap = await getDoc(doc(db, "users", walk.uid));
                                const userData = userDocSnap.exists() ? userDocSnap.data() : {};
                                return {
                                    ...walk,
                                    prefecture: walk.prefecture || "",
                                    location: walk.location || "",
                                    owner: {
                                        username: userData.owner?.username || "飼い主",
                                        ownerImageURL: userData.owner?.ownerImageURL || "",
                                    },
                                    pet: {
                                        petName: userData.pet?.petName || "名無し",
                                        petBreed: userData.pet?.breed || "犬種不明",
                                        petAge: userData.pet?.petAge || "?",
                                        petGender: userData.pet?.petGender || "不明",
                                    },
                                };
                            } catch {
                                return walk;
                            }
                        })
                    );

                    setWalks(walkData);
                    setLoading(false);
                }
            );

            return () => unsubscribeSnapshot();
        });

        return () => unsubscribeAuth();
    }, [auth]);

    const toggleLike = async (walkId, likes = []) => {
        const user = auth.currentUser;
        if (!user) return alert("ログインが必要です");

        const newLikes = likes.includes(user.uid)
            ? likes.filter((uid) => uid !== user.uid)
            : [...likes, user.uid];
        setWalks((prev) =>
            prev.map((w) => (w.id === walkId ? { ...w, likes: newLikes } : w))
        );

        const ref = doc(db, "walkRequests", walkId);
        try {
            if (likes.includes(user.uid)) await updateDoc(ref, { likes: arrayRemove(user.uid) });
            else await updateDoc(ref, { likes: arrayUnion(user.uid) });
        } catch (err) {
            console.error("いいね更新エラー:", err);
        }
    };

    const filteredWalks = selectedArea
        ? walks.filter((walk) => walk.prefecture === selectedArea)
        : walks;

    if (loading) return <p className="text-center mt-5">読み込み中...</p>;

    return (
        <div style={{ backgroundColor: "#fdfcf7", minHeight: "100vh", padding: "1rem" }}>
            {/* ヘッダー */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                    padding: "1rem",
                    borderRadius: "1rem",
                    backgroundColor: "#faf7ee",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    flexWrap: "wrap",
                }}
            >
                <h2 style={{ margin: 0, fontWeight: "bold", color: "#ff6f61" }}>散歩の掲示板</h2>

                <select
                    style={{
                        width: "180px",
                        padding: "0.3rem 0.5rem",
                        borderRadius: "0.5rem",
                        border: "1px solid #e0e0e0",
                        backgroundColor: "#ffffff",
                    }}
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                >
                    <option value="">すべての地域</option>
                    {[
                        "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
                        "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
                        "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
                        "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
                        "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
                        "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
                        "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
                    ].map((pref) => (
                        <option key={pref} value={pref}>{pref}</option>
                    ))}
                </select>
            </div>

            {/* 投稿一覧 */}
            {filteredWalks.length === 0 && (
                <p className="text-center" style={{ color: "#777" }}>投稿がありません</p>
            )}

            {filteredWalks.map((walk) => {
                const user = auth.currentUser;
                const isLiked = walk.likes?.includes(user?.uid);

                const postTime = walk.createdAt?.toDate
                    ? format(walk.createdAt.toDate(), "MM/dd HH:mm", { locale: ja })
                    : "日時不明";

                return (
                    <div
                        key={walk.id}
                        onClick={() => navigate(`/home/walkDetail/${walk.id}`)}
                        style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "1rem",
                            padding: "1rem",
                            marginBottom: "1rem",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                            cursor: "pointer",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem" }}>
                            <img
                                src={walk.owner?.ownerImageURL || "/images.jpg"}
                                alt="owner"
                                style={{
                                    width: "42px",
                                    height: "42px",
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    border: "1px solid #ddd",
                                    marginRight: "0.5rem",
                                    cursor: "pointer",
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/home/profile/${walk.uid}`);
                                }}
                            />
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/home/profile/${walk.uid}`);
                                }}
                                style={{ cursor: "pointer" }}
                            >
                                <div style={{ fontWeight: "bold", color: "#333" }}>{walk.owner?.username}</div>
                                <small style={{ color: "#555" }}>
                                    {walk.pet?.petBreed}「{walk.pet?.petName}」 ({walk.pet?.petAge}歳)・
                                    {walk.prefecture} {walk.location}
                                </small>
                            </div>
                            <span style={{ marginLeft: "auto", color: "#999", fontSize: "0.8rem" }}>{postTime}</span>
                        </div>

                        <div style={{ padding: "0.5rem", backgroundColor: "#faf7ee", borderRadius: "0.5rem", marginBottom: "0.5rem" }}>
                            <div style={{ fontWeight: "bold", color: "#ff6f61", marginBottom: "0.3rem" }}>{walk.title}</div>
                            <div style={{ whiteSpace: "pre-line", color: "#555" }}>{walk.content}</div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center" }}>
                            <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/home/chatStart/${walk.uid}`); }}
                                style={{ border: "none", background: "transparent", display: "flex", alignItems: "center", marginRight: "1rem", color: "#ff6f61", cursor: "pointer" }}
                            >
                                <FaCommentDots style={{ marginRight: "0.3rem" }} /> チャット
                            </button>

                            <button
                                onClick={(e) => { e.stopPropagation(); toggleLike(walk.id, walk.likes); }}
                                style={{ border: "none", background: "transparent", display: "flex", alignItems: "center", color: isLiked ? "#ff6f61" : "#999", cursor: "pointer" }}
                            >
                                {isLiked ? <FaHeart style={{ marginRight: "0.3rem" }} /> : <FaRegHeart style={{ marginRight: "0.3rem" }} />}
                                {walk.likes?.length || 0}
                            </button>
                        </div>
                    </div>
                );
            })}

            <button
                onClick={() => navigate("/home/walkRequest")}
                style={{
                    position: "fixed",
                    bottom: "2rem",
                    right: "2rem",
                    width: "3.5rem",
                    height: "3.5rem",
                    borderRadius: "50%",
                    backgroundColor: "#ff6f61",
                    color: "#fff",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.2rem",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                    cursor: "pointer",
                }}
            >
                <FaPlus />
            </button>
        </div>
    );
};

export default WalkList;
