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
import {
    FaPaw,
    FaPlus,
    FaHeart,
    FaRegHeart,
    FaComment,
    FaPaperPlane,
} from "react-icons/fa";

const WalkList = () => {
    const [walks, setWalks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [commentInputs, setCommentInputs] = useState({});
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
                setCurrentUserData(null);
            }

            const unsubscribeSnapshot = onSnapshot(
                collection(db, "walkRequests"),
                async (snapshot) => {
                    const now = new Date();
                    const walkDocs = snapshot.docs
                        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
                        .filter((walk) => walk.uid !== user.uid)
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
                                owner: {
                                    username: userData.owner?.username || walk.username || "飼い主",
                                    ownerImageURL: userData.owner?.ownerImageURL || "",
                                },
                                pet: {
                                    petName: userData.pet?.petName || walk.pet?.petName || "名無し",
                                    petBreed:
                                        userData.pet?.breed || walk.pet?.petBreed || "犬種不明",
                                    petAge: userData.pet?.petAge || walk.pet?.petAge || "?",
                                    petGender:
                                        userData.pet?.petGender || walk.pet?.petGender || "不明",
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

    const addComment = async (walkId) => {
        const user = auth.currentUser;
        if (!user) return alert("ログインが必要です");
        const text = commentInputs[walkId]?.trim();
        if (!text) return;

        try {
            const ref = doc(db, "walkRequests", walkId);
            await updateDoc(ref, {
                comments: arrayUnion({
                    uid: user.uid,
                    username: currentUserData?.owner?.username || "匿名ユーザー",
                    text,
                    createdAt: new Date(),
                }),
            });
            setCommentInputs((prev) => ({ ...prev, [walkId]: "" }));
        } catch (err) {
            alert("コメントの送信に失敗しました");
        }
    };

    if (loading) return <p className="text-center mt-5">読み込み中...</p>;

    return (
        <div className="walk-board container py-3">
            {/* 内部CSS（コンポーネント内で完結） */}
            <style>{`
                .walk-board {
                    background-color: #f8f9fa;
                    min-height: 100vh;
                }
                .walk-post {
                    background-color: #ffffff;
                    border: 1px solid #e6e6e6;
                    border-radius: 1rem;
                    transition: transform 0.15s ease, box-shadow 0.15s ease;
                }
                .walk-post:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                }
                .owner-img {
                    width: 42px;
                    height: 42px;
                    border-radius: 50%;
                    object-fit: cover;
                    cursor: pointer;
                    border: 1px solid #ddd;
                }
                .walk-body {
                    border-left: 3px solid #ffc107;
                    background-color: #fcfcfc;
                }
                .walk-comments {
                    font-size: 0.85rem;
                    background-color: #fdfdfd;
                    border-left: 2px solid #007bff;
                }
                .comment-item strong {
                    color: #007bff;
                }
                .comment-input input:focus {
                    outline: none;
                    box-shadow: none;
                }
                .new-post-btn {
                    position: fixed;
                    bottom: 2rem;
                    right: 2rem;
                    width: 3.2rem;
                    height: 3.2rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    border-radius: 50%;
                }
            `}</style>

            <div className="d-flex align-items-center justify-content-between mb-4">
                <h2 className="fw-bold text-primary d-flex align-items-center">
                    <FaPaw className="text-warning me-2" /> 散歩の掲示板
                </h2>
            </div>

            {walks.length === 0 && <p className="text-center text-muted">投稿がありません</p>}

            <div className="walk-list">
                {walks.map((walk) => {
                    const user = auth.currentUser;
                    const isLiked = walk.likes?.includes(user?.uid);
                    const postTime = walk.createdAt?.toDate
                        ? format(walk.createdAt.toDate(), "MM/dd HH:mm", { locale: ja })
                        : "日時不明";

                    return (
                        <div className="walk-post mb-4 p-3" key={walk.id}>
                            <div className="walk-header d-flex align-items-center mb-2">
                                <img
                                    src={walk.owner?.ownerImageURL || "/default-icon.png"}
                                    alt="owner"
                                    className="owner-img me-2"
                                    onClick={() => navigate(`/home/profile/${walk.uid}`)}
                                />
                                <div>
                                    <h6
                                        className="fw-bold m-0"
                                        onClick={() => navigate(`/home/profile/${walk.uid}`)}
                                        style={{ cursor: "pointer" }}
                                    >
                                        {walk.owner?.username}
                                    </h6>
                                    <small className="text-muted">
                                        {walk.pet?.petBreed}「{walk.pet?.petName}」 ({walk.pet?.petAge}歳)
                                    </small>
                                </div>
                                <span className="ms-auto text-muted small">{postTime}</span>
                            </div>

                            <div className="walk-body p-3 rounded mb-2">
                                <h5 className="fw-bold text-dark mb-1">{walk.title}</h5>
                                <p className="m-0" style={{ whiteSpace: "pre-line" }}>
                                    {walk.content}
                                </p>
                            </div>

                            <div className="walk-footer d-flex align-items-center">
                                <button
                                    className="btn btn-sm d-flex align-items-center me-3"
                                    onClick={() => toggleLike(walk.id, walk.likes)}
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

                            {walk.comments?.length > 0 && (
                                <div className="walk-comments mt-2 p-2 rounded bg-white border">
                                    {walk.comments.map((c, i) => (
                                        <div key={i} className="comment-item mb-1 small">
                                            <strong>{c.username}</strong>：{c.text}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="comment-input d-flex align-items-center mt-2 bg-light rounded-pill px-2">
                                <input
                                    type="text"
                                    className="form-control form-control-sm border-0 bg-light"
                                    placeholder="コメントを入力..."
                                    value={commentInputs[walk.id] || ""}
                                    onChange={(e) =>
                                        setCommentInputs((prev) => ({
                                            ...prev,
                                            [walk.id]: e.target.value,
                                        }))
                                    }
                                />
                                <button
                                    className="btn text-primary"
                                    onClick={() => addComment(walk.id)}
                                    style={{ border: "none", background: "transparent" }}
                                >
                                    <FaPaperPlane />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 📍 右下固定の新規投稿ボタン */}
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
