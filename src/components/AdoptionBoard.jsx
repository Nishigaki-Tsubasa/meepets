// AdoptionBoard.jsx
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
import { FaHeart, FaRegHeart, FaPlus, FaDog } from "react-icons/fa";

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
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedPrefecture, setSelectedPrefecture] = useState("");

    const auth = getAuth();
    const navigate = useNavigate();

    // Firestoreから投稿取得
    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                setPosts([]);
                setCurrentUser(null);
                setLoading(false);
                return;
            }

            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                setCurrentUser(userDoc.exists() ? userDoc.data() : null);
            } catch (err) {
                console.error("ユーザー情報取得エラー:", err);
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

    // いいね処理
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

    if (loading) return <p className="text-center mt-5">読み込み中...</p>;

    // フィルター適用
    const filteredPosts = selectedPrefecture
        ? posts.filter((post) => post.area === selectedPrefecture)
        : posts;

    return (
        <div className="container py-3">
            <style>{`
        .adopt-card {
          background: #fff;
          border-radius: 1rem;
          border: 1px solid #eee;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
          overflow: hidden;
          transition: 0.2s;
        }
        .adopt-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .adopt-img {
          width: 100%;
          height: 220px;
          object-fit: cover;
        }
        .new-post-btn {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          border-radius: 50%;
          width: 3.5rem;
          height: 3.5rem;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 1.3rem;
        }
      `}</style>

            <h2 className="fw-bold text-primary d-flex align-items-center mb-3">
                <FaDog className="text-warning me-2" /> いぬの里親募集掲示板
            </h2>

            {/* 都道府県フィルター */}
            <div className="mb-3">
                <select
                    className="form-select w-auto"
                    value={selectedPrefecture}
                    onChange={(e) => setSelectedPrefecture(e.target.value)}
                >
                    <option value="">全ての地域</option>
                    {prefectures.map((pref) => (
                        <option key={pref} value={pref}>
                            {pref}
                        </option>
                    ))}
                </select>
            </div>

            {filteredPosts.length === 0 && (
                <p className="text-center text-muted">投稿がありません</p>
            )}

            <div className="row">
                {filteredPosts.map((post) => {
                    const isLiked = post.likes?.includes(auth.currentUser?.uid);
                    const created = post.createdAt?.toDate
                        ? format(post.createdAt.toDate(), "MM/dd HH:mm", { locale: ja })
                        : "日時不明";

                    return (
                        <div className="col-md-6 mb-4" key={post.id}>
                            <div className="adopt-card">
                                {post.imageURL && (
                                    <img src={post.imageURL} alt="dog" className="adopt-img" />
                                )}
                                <div className="p-3">
                                    <h5 className="fw-bold text-dark">{post.title}</h5>
                                    <p className="mb-1 text-secondary">
                                        {post.breed}（{post.age}歳・{post.gender}）
                                    </p>
                                    <p className="small">{post.description}</p>
                                    <p className="text-muted small">地域：{post.area || "不明"}</p>
                                    <div className="d-flex align-items-center mb-2">
                                        <button
                                            className="btn btn-sm d-flex align-items-center me-3"
                                            onClick={() => toggleLike(post.id, post.likes)}
                                            style={{ border: "none", background: "transparent" }}
                                        >
                                            {isLiked ? (
                                                <FaHeart className="text-danger me-1" />
                                            ) : (
                                                <FaRegHeart className="text-secondary me-1" />
                                            )}
                                            <span>{post.likes?.length || 0}</span>
                                        </button>
                                        <span className="ms-auto small text-muted">{created}</span>
                                    </div>

                                    {/* チャットボタン */}
                                    <div className="d-flex align-items-center mt-2">
                                        <button
                                            className="btn btn-outline-primary btn-sm w-100"
                                            onClick={() => navigate(`/home/chatStart/${post.uid}`)}
                                        >
                                            持ち主にチャットを送る
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 新規投稿ボタン */}
            <button
                className="btn btn-primary shadow-lg new-post-btn"
                onClick={() => navigate("/home/AdoptionForm")}
            >
                <FaPlus />
            </button>
        </div>
    );
};

export default AdoptionBoard;
