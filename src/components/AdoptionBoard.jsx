import React, { useEffect, useState } from "react";
import { collection, onSnapshot, updateDoc, doc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebase/firebase";
import { format } from "date-fns";
import ja from "date-fns/locale/ja";
import { useNavigate } from "react-router-dom";
import { FaDog, FaHeart, FaRegHeart, FaPlus, FaComment, FaMapMarkerAlt } from "react-icons/fa";

const prefectures = [
    "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
    "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
    "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
    "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
    "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
    "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
    "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

const AdoptionBoard = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPrefecture, setSelectedPrefecture] = useState("");
    const auth = getAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                setPosts([]);
                setLoading(false);
                return;
            }

            const unsubscribePosts = onSnapshot(collection(db, "adoptionPosts"), async (snapshot) => {
                const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
                const sorted = docs.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
                const withUser = [];
                for (const post of sorted) {
                    try {
                        const uSnap = await getDoc(doc(db, "users", post.uid));
                        const uData = uSnap.exists() ? uSnap.data() : {};
                        withUser.push({ ...post, owner: uData });
                    } catch {
                        withUser.push(post);
                    }
                }
                setPosts(withUser);
                setLoading(false);
            });

            return () => unsubscribePosts();
        });

        return () => unsubscribeAuth();
    }, [auth]);

    const toggleLike = async (postId, likes = []) => {
        const user = auth.currentUser;
        if (!user) return alert("ログインが必要です");
        const ref = doc(db, "adoptionPosts", postId);
        try {
            if (likes.includes(user.uid)) {
                await updateDoc(ref, { likes: arrayRemove(user.uid) });
            } else {
                await updateDoc(ref, { likes: arrayUnion(user.uid) });
            }
        } catch (err) {
            console.error("いいね更新エラー:", err);
        }
    };

    if (loading) return <p className="text-center mt-5" style={{ fontSize: "1.5rem" }}>読み込み中...</p>;

    const filteredPosts = selectedPrefecture
        ? posts.filter((post) => post.area === selectedPrefecture)
        : posts;

    return (
        <div style={{ backgroundColor: "#fdfcf7", minHeight: "100vh", padding: "2rem" }}>
            {/* ヘッダー */}
            <div style={{
                display: "flex", flexWrap: "wrap", justifyContent: "space-between",
                alignItems: "center", backgroundColor: "#fffef9", borderRadius: "1rem",
                padding: "1.5rem 2rem", boxShadow: "0 6px 20px rgba(0,0,0,0.1)", marginBottom: "1.5rem"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <h2 style={{ fontWeight: 700, color: "#5a452e", fontSize: "1.8rem", margin: 0 }}>いぬの里親掲示板</h2>
                </div>

                <select
                    style={{
                        borderRadius: "2rem",
                        padding: "0.6rem 1.2rem",
                        border: "none",
                        backgroundColor: "rgba(255,255,255,0.85)",
                        backdropFilter: "blur(6px)",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: "1rem"
                    }}
                    value={selectedPrefecture}
                    onChange={(e) => setSelectedPrefecture(e.target.value)}
                >
                    <option value="">すべての地域</option>
                    {prefectures.map((pref) => <option key={pref} value={pref}>{pref}</option>)}
                </select>
            </div>

            {filteredPosts.length === 0 && <p className="text-center text-muted" style={{ fontSize: "1.2rem" }}>🐾 投稿がありません</p>}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
                {filteredPosts.map((post) => {
                    const isLiked = post.likes?.includes(auth.currentUser?.uid);
                    const created = post.createdAt?.toDate
                        ? format(post.createdAt.toDate(), "MM/dd HH:mm", { locale: ja })
                        : "日時不明";

                    return (
                        <div key={post.id} style={{
                            backgroundColor: "#fffef9",
                            borderRadius: "1rem",
                            overflow: "hidden",
                            boxShadow: "0 6px 22px rgba(0,0,0,0.1)",
                            display: "flex",
                            flexDirection: "column"
                        }}>
                            <div style={{ position: "relative" }}>
                                <img
                                    src={post.imageURL || "/images.jpg"}
                                    alt="dog"
                                    style={{ width: "100%", height: "260px", objectFit: "cover" }}
                                />
                                <span style={{
                                    position: "absolute",
                                    top: "0.5rem",
                                    left: "0.5rem",
                                    backgroundColor: "rgba(255,255,255,0.85)",
                                    borderRadius: "0.5rem",
                                    padding: "0.3rem 0.6rem",
                                    fontSize: "0.85rem",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.3rem"
                                }}>
                                    <FaMapMarkerAlt className="text-danger" /> {post.area || "不明"}
                                </span>
                            </div>

                            <div style={{ padding: "1.2rem", borderLeft: "4px solid #ffc107", flex: 1 }}>
                                <h5 style={{ fontWeight: 700, marginBottom: "0.6rem", fontSize: "1.4rem" }}>{post.title}</h5>
                                <p style={{ color: "#555", fontSize: "1.05rem", marginBottom: "0.5rem" }}>
                                    {post.breed}（{post.age}歳・{post.gender}）
                                </p>
                                <p style={{ color: "#888", fontSize: "0.95rem" }}>{post.description}</p>

                                <div style={{ display: "flex", alignItems: "center", marginTop: "0.6rem" }}>
                                    <button
                                        onClick={() => toggleLike(post.id, post.likes)}
                                        style={{
                                            border: "none",
                                            background: "transparent",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.4rem",
                                            cursor: "pointer",
                                            fontSize: "1.1rem"
                                        }}
                                    >
                                        {isLiked ? <FaHeart className="text-danger" /> : <FaRegHeart className="text-secondary" />}
                                        <span>{post.likes?.length || 0}</span>
                                    </button>
                                    <span style={{ marginLeft: "auto", fontSize: "0.85rem", color: "#888" }}>{created}</span>
                                </div>

                                {/* チャット送信ボタン */}
                                <button
                                    onClick={() => navigate(`/home/chatStart/${post.uid}`)}
                                    style={{
                                        marginTop: "0.7rem",
                                        width: "100%",
                                        padding: "0.7rem",
                                        borderRadius: "1.5rem",
                                        border: "none",
                                        backgroundColor: "#ff6f61", // 変更済み
                                        color: "#fff",
                                        cursor: "pointer",
                                        fontSize: "1.05rem"
                                    }}
                                >
                                    <FaComment className="me-2" /> チャットを送信
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 新規投稿ボタン */}
            <button
                onClick={() => navigate("/home/AdoptionForm")}
                style={{
                    position: "fixed",
                    bottom: "2rem",
                    right: "2rem",
                    width: "3.6rem",
                    height: "3.6rem",
                    borderRadius: "50%",
                    border: "none",
                    backgroundColor: "#ff6f61", // 変更済み
                    color: "#fff",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: "1.4rem",
                    cursor: "pointer",
                    boxShadow: "0 5px 15px rgba(0,0,0,0.3)"
                }}
            >
                <FaPlus />
            </button>
        </div>
    );
};

export default AdoptionBoard;
