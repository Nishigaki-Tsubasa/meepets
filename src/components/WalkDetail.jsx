import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebase/firebase";
import { format } from "date-fns";
import ja from "date-fns/locale/ja";
import { FaHeart, FaRegHeart, FaTrash } from "react-icons/fa";

const WalkDetail = () => {
    const { id } = useParams();
    const [walk, setWalk] = useState(null);
    const [commentText, setCommentText] = useState("");
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

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!auth.currentUser) return alert("ログインが必要です");
        if (!commentText.trim()) return;

        const commentData = {
            id: Date.now().toString(),
            uid: auth.currentUser.uid,
            username: auth.currentUser.displayName || "匿名",
            text: commentText,
            createdAt: new Date(), // クライアント側では Date
        };

        const ref = doc(db, "walkRequests", id);
        try {
            await updateDoc(ref, { comments: arrayUnion(commentData) });
            setWalk((prev) => ({
                ...prev,
                comments: [...(prev.comments || []), commentData],
            }));
            setCommentText("");
        } catch (err) {
            console.error("コメント追加エラー:", err);
        }
    };

    const handleCommentDelete = async (commentId) => {
        const comment = walk.comments.find((c) => c.id === commentId);
        if (!comment) return;
        if (!auth.currentUser || auth.currentUser.uid !== comment.uid) return alert("削除権限がありません");

        const ref = doc(db, "walkRequests", id);
        try {
            await updateDoc(ref, { comments: arrayRemove(comment) });
            setWalk((prev) => ({
                ...prev,
                comments: prev.comments.filter((c) => c.id !== commentId),
            }));
        } catch (err) {
            console.error("コメント削除エラー:", err);
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
        <div className="container py-4">
            <style>{`
        .walk-card { background-color: #fffef9; border-radius: 1rem; padding: 2rem; box-shadow: 0 8px 20px rgba(0,0,0,0.08); max-width: 700px; margin: 0 auto 2rem auto; }
        .walk-header { margin-bottom: 1rem; }
        .walk-title { font-size: 1.8rem; font-weight: 700; color: #5a452e; margin-bottom: 0.2rem; }
        .walk-subtitle { font-size: 0.9rem; color: #888; }
        .walk-details { background: #fffaf3; border-radius: 1rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding: 1rem; margin-bottom: 1rem; }
        .detail-label { font-weight: 600; font-size: 0.85rem; color: #555; margin-bottom: 0.2rem; }
        .detail-value { font-weight: 500; font-size: 0.95rem; color: #333; }
        .walk-body { background: #fff; padding: 1rem; border-radius: 1rem; box-shadow: 0 2px 6px rgba(0,0,0,0.05); margin-bottom: 1rem; }
        .walk-pet-img { width: 120px; height: 120px; border-radius: 1rem; object-fit: cover; border: 1px solid #ddd; margin-bottom: 1rem; }
        .walk-footer { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
        .comment-section { margin-top: 2rem; }
        .comment { background: #fff; padding: 0.8rem 1rem; border-radius: 1rem; margin-bottom: 0.8rem; display: flex; justify-content: space-between; align-items: center; }
        .comment-user { font-weight: 600; margin-bottom: 0.2rem; }
        .comment-text { font-size: 0.95rem; }
        .comment-time { font-size: 0.75rem; color: #888; }
      `}</style>

            <div className="walk-card">
                <div className="walk-header">
                    <div className="walk-title">{walk.title}</div>
                    <div className="walk-subtitle">投稿日時: {postTime}</div>
                </div>

                {walk.pet?.image && <img src={walk.pet.image} alt="ペット" className="walk-pet-img" />}

                <div className="walk-details">
                    <div>
                        <div className="detail-label">場所</div>
                        <div className="detail-value">{walk.prefecture} {walk.location}</div>
                    </div>
                    <div>
                        <div className="detail-label">日時</div>
                        <div className="detail-value">{walkTime}</div>
                    </div>
                    <div>
                        <div className="detail-label">ペット</div>
                        <div className="detail-value">{walk.pet?.breed} 「{walk.pet?.name}」</div>
                    </div>
                    <div>
                        <div className="detail-label">年齢/性別</div>
                        <div className="detail-value">
                            {walk.pet?.age}歳 / {walk.pet?.gender === "female" ? "メス" : walk.pet?.gender === "male" ? "オス" : "不明"}
                        </div>
                    </div>
                </div>

                <div className="walk-body">{walk.content}</div>

                <div className="walk-footer">
                    <button className="btn btn-light d-flex align-items-center" onClick={handleLike} style={{ borderRadius: "1rem" }}>
                        {isLiked ? <FaHeart className="text-danger me-1" /> : <FaRegHeart className="text-secondary me-1" />}
                        {walk.likes?.length || 0} いいね
                    </button>
                </div>

                <div className="comment-section">
                    <h5>コメント</h5>
                    {walk.comments?.map((comment) => (
                        <div className="comment" key={comment.id}>
                            <div>
                                <div className="comment-user">{comment.username}</div>
                                <div className="comment-text">{comment.text}</div>
                                <div className="comment-time">
                                    {comment.createdAt?.toDate
                                        ? format(comment.createdAt.toDate(), "MM/dd HH:mm", { locale: ja })
                                        : format(new Date(comment.createdAt), "MM/dd HH:mm", { locale: ja })}
                                </div>
                            </div>
                            {auth.currentUser?.uid === comment.uid && (
                                <FaTrash className="text-danger" style={{ cursor: "pointer" }} onClick={() => handleCommentDelete(comment.id)} />
                            )}
                        </div>
                    ))}
                    <form onSubmit={handleCommentSubmit} className="d-flex gap-2 mt-2">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="コメントを追加..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary">送信</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default WalkDetail;
