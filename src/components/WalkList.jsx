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
import { FaPaw, FaPlus, FaHeart, FaRegHeart, FaComment } from "react-icons/fa";

const WalkList = () => {
    const [walks, setWalks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedArea, setSelectedArea] = useState("");
    const [currentUserData, setCurrentUserData] = useState(null);
    const auth = getAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                setWalks([]);
                setCurrentUserData(null);
                setLoading(false);
                return;
            }

            try {
                const userDocSnap = await getDoc(doc(db, "users", user.uid));
                const userData = userDocSnap.exists() ? userDocSnap.data() : {};
                setCurrentUserData(userData);
            } catch (err) {
                console.error("ユーザー情報取得エラー:", err);
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
                                walk.datetime?.toDate && walk.datetime.toDate() > now
                        )
                        .sort((a, b) => a.datetime.toDate() - b.datetime.toDate());

                    const walkData = [];
                    for (const walk of walkDocs) {
                        try {
                            const userDocSnap = await getDoc(doc(db, "users", walk.uid));
                            const userData = userDocSnap.exists() ? userDocSnap.data() : {};
                            walkData.push({
                                ...walk,
                                prefecture: walk.prefecture || "",
                                location: walk.location || "",
                                owner: {
                                    username: userData.owner?.username || walk.username || "飼い主",
                                    ownerImageURL: userData.owner?.ownerImageURL || "",
                                },
                                pet: {
                                    petName: userData.pet?.petName || walk.pet?.name || "名無し",
                                    petBreed: userData.pet?.breed || walk.pet?.breed || "犬種不明",
                                    petAge: userData.pet?.petAge || walk.pet?.age || "?",
                                    petGender: userData.pet?.petGender || walk.pet?.gender || "不明",
                                },
                            });
                        } catch (err) {
                            walkData.push(walk);
                        }
                    }
                    setWalks(walkData);
                    setLoading(false);
                }
            );

            return () => unsubscribeSnapshot();
        });

        return () => unsubscribeAuth();
    }, [auth]);

    // いいね機能
    const toggleLike = async (walkId, likes = []) => {
        const user = auth.currentUser;
        if (!user) return alert("ログインが必要です");
        const ref = doc(db, "walkRequests", walkId);
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

    // 都道府県でフィルタリング
    const filteredWalks = selectedArea
        ? walks.filter((walk) => walk.prefecture === selectedArea)
        : walks;

    if (loading) return <p className="text-center mt-5">読み込み中...</p>;

    return (
        <div className="walk-board container py-3">
            <style>{`
                .walk-board { background-color: #f8f9fa; min-height: 100vh; }
                .header-bar { background: rgba(255,255,255,0.6); backdrop-filter: blur(8px); border-radius: 1rem; padding: 1rem 1.5rem; box-shadow: 0 6px 20px rgba(0,0,0,0.1); }
                .area-filter select { border-radius: 2rem; transition: all 0.2s ease; }
                .area-filter select:hover { transform: translateY(-1px); box-shadow: 0 3px 8px rgba(0,0,0,0.15); }
                .walk-post { background-color: #ffffff; border: 1px solid #e6e6e6; border-radius: 1rem; transition: transform 0.15s ease, box-shadow 0.15s ease; cursor: pointer; }
                .walk-post:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
                .owner-img { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 1px solid #ddd; }
                .walk-body { border-left: 3px solid #ffc107; background-color: #fcfcfc; }
                .new-post-btn { position: fixed; bottom: 2rem; right: 2rem; width: 3.2rem; height: 3.2rem; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; border-radius: 50%; }
            `}</style>

            {/* ヘッダー */}
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap header-bar">
                <div className="d-flex align-items-center mb-2 mb-md-0">
                    <FaPaw className="text-warning me-2 fs-3" />
                    <h2 className="fw-bold text-primary m-0">散歩の掲示板</h2>
                </div>

                {/* 都道府県フィルター */}
                <div className="area-filter ms-md-3 mt-2 mt-md-0">
                    <select
                        className="form-select shadow-sm border-0 fw-semibold"
                        style={{ width: "200px", backgroundColor: "rgba(255,255,255,0.85)", backdropFilter: "blur(6px)" }}
                        value={selectedArea}
                        onChange={(e) => setSelectedArea(e.target.value)}
                    >
                        <option value="">すべての地域</option>
                        {[
                            "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
                            "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
                            "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県",
                            "三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
                            "鳥取県", "島根県", "岡山県", "広島県", "山口県",
                            "徳島県", "香川県", "愛媛県", "高知県",
                            "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
                        ].map((pref) => (
                            <option key={pref} value={pref}>{pref}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 投稿一覧 */}
            {filteredWalks.length === 0 && <p className="text-center text-muted">投稿がありません</p>}

            <div className="walk-list">
                {filteredWalks.map((walk) => {
                    const user = auth.currentUser;
                    const isLiked = walk.likes?.includes(user?.uid);
                    const postTime = walk.createdAt?.toDate
                        ? format(walk.createdAt.toDate(), "MM/dd HH:mm", { locale: ja })
                        : "日時不明";

                    return (
                        <div
                            className="walk-post mb-4 p-3"
                            key={walk.id}
                            onClick={() => navigate(`/home/walkDetail/${walk.id}`)}
                        >
                            <div className="walk-header d-flex align-items-center mb-2">
                                {/* プロフィール遷移対応 */}
                                <img
                                    src={walk.owner?.ownerImageURL || "/images.jpg"}
                                    alt="owner"
                                    className="owner-img me-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/home/profile/${walk.uid}`);

                                    }}
                                    style={{ cursor: "pointer" }}
                                />
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/home/profile/${walk.uid}`);
                                    }}
                                    style={{ cursor: "pointer" }}
                                >
                                    <h6 className="fw-bold m-0">{walk.owner?.username}</h6>
                                    <small className="text-muted">
                                        {walk.pet?.petBreed}「{walk.pet?.petName}」 ({walk.pet?.petAge}歳)・{walk.prefecture} {walk.location}
                                    </small>
                                </div>
                                <span className="ms-auto text-muted small">{postTime}</span>
                            </div>

                            <div className="walk-body p-3 rounded mb-2">
                                <h5 className="fw-bold text-dark mb-1">{walk.title}</h5>
                                <p className="m-0" style={{ whiteSpace: "pre-line" }}>{walk.content}</p>
                            </div>

                            <div className="walk-footer d-flex align-items-center">
                                <button
                                    className="btn btn-sm d-flex align-items-center me-3"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleLike(walk.id, walk.likes);
                                    }}
                                    style={{ border: "none", background: "transparent" }}
                                >
                                    {isLiked ? (
                                        <FaHeart className="text-danger me-1" />
                                    ) : (
                                        <FaRegHeart className="text-secondary me-1" />
                                    )}
                                    <span>{walk.likes?.length || 0}</span>
                                </button>
                                <FaComment className="text-secondary me-1" />
                                <span>{walk.comments?.length || 0}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 新規投稿ボタン */}
            <button
                className="btn btn-primary shadow-lg new-post-btn"
                onClick={() => navigate("/home/walkRequest")}
            >
                <FaPlus />
            </button>
        </div>
    );
};

export default WalkList;
