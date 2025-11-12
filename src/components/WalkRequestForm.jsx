import React, { useState } from "react";
import { collection, addDoc, Timestamp, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebase/firebase";
import { v4 as uuidv4 } from "uuid";

const WalkRequestForm = () => {
    const [form, setForm] = useState({
        title: "",
        content: "",
        prefecture: "",
        location: "",
        date: "",
        time: "",
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);

        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
            alert("ログインが必要です");
            setLoading(false);
            return;
        }

        try {
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists()) throw new Error("ユーザーデータが見つかりません");

            const userData = userDocSnap.data();

            const petData = {
                name: userData.pet?.petName || "不明",
                breed: userData.pet?.breed || "不明",
                age: userData.pet?.petAge || "?",
                gender: userData.pet?.petGender || "?",
                image: userData.pet?.petImageURL || "",
            };

            await addDoc(collection(db, "walkRequests"), {
                uid: user.uid,
                username: userData.owner?.username || userData.displayName || "匿名",
                title: form.title,
                content: form.content,
                pet: petData,
                prefecture: form.prefecture,
                location: form.location,
                datetime:
                    form.date && form.time
                        ? Timestamp.fromDate(new Date(`${form.date}T${form.time}:00`))
                        : null,
                createdAt: Timestamp.now(),
                status: "open",
                applicants: [],
                roomId: uuidv4(),
            });

            setForm({
                title: "",
                content: "",
                prefecture: "",
                location: "",
                date: "",
                time: "",
            });

            window.location.href = "/home/WalkList";
        } catch (error) {
            console.error(error);
            alert("投稿に失敗しました。");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container my-5">
            <style>{`
        .walk-form {
          background-color: #fffaf3;
          max-width: 650px;
          margin: 0 auto;
          padding: 2.5rem;
          border-radius: 1.5rem;
          box-shadow: 0 6px 16px rgba(0,0,0,0.1);
          font-size: 1rem;
        }
        .form-title {
          text-align: center;
          font-weight: bold;
          color: #5a452e;
          font-size: clamp(1.6rem, 4vw, 2.2rem);
          margin-bottom: 1.8rem;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
        }
        .form-label {
          font-weight: 600;
          color: #3f3b36;
        }
        .form-control {
          border: 1px solid #d5c9b8;
          border-radius: 0.5rem;
          padding: 0.6rem 0.9rem;
          transition: all 0.2s ease;
        }
        .form-control:focus {
          border-color: #86b97e;
          box-shadow: 0 0 0 3px rgba(134, 185, 126, 0.25);
        }
        .Walk-btn {
          background: linear-gradient(135deg, #8bc34a, #6da73b);
          color: #fff;
          font-weight: 600;
          font-size: 1.1rem;
          border: none;
          border-radius: 0.7rem;
          padding: 0.7rem;
          transition: all 0.3s ease;
        }
        .Walk-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #7bb041, #5d8f33);
          transform: translateY(-1px);
        }
        .Walk-btn:disabled {
          background: #bcd5a0;
          cursor: not-allowed;
        }
        .note-text {
          font-size: 0.9rem;
          color: #7d756b;
        }
      `}</style>

            <h2 className="form-title">🐾 ペット掲示板に投稿する</h2>

            <form className="walk-form" onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="form-label">タイトル</label>
                    <input
                        type="text"
                        className="form-control"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        placeholder="例）一緒にお散歩できる友達を募集！"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="form-label">募集内容</label>
                    <textarea
                        className="form-control"
                        name="content"
                        rows="4"
                        value={form.content}
                        onChange={handleChange}
                        placeholder="例）トイプードル（3歳・♀）です。〇〇公園で一緒に遊んでくれるお友達を探しています！"
                        required
                    ></textarea>
                </div>

                {/* 都道府県と具体的な場所 */}
                <div className="mb-4">
                    <label className="form-label">都道府県</label>
                    <select
                        className="form-control mb-2"
                        name="prefecture"
                        value={form.prefecture}
                        onChange={handleChange}
                        required
                    >
                        <option value="">選択してください</option>
                        {[
                            "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
                            "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
                            "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
                            "岐阜県", "静岡県", "愛知県", "三重県",
                            "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
                            "鳥取県", "島根県", "岡山県", "広島県", "山口県",
                            "徳島県", "香川県", "愛媛県", "高知県",
                            "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
                        ].map((pref) => (
                            <option key={pref} value={pref}>{pref}</option>
                        ))}
                    </select>

                    <label className="form-label">具体的な場所</label>
                    <input
                        type="text"
                        className="form-control"
                        name="location"
                        value={form.location}
                        onChange={handleChange}
                        placeholder="例）〇〇公園、〇〇駅付近"
                    />
                    <small className="note-text">※都道府県と具体的な場所を入力するとマッチングしやすくなります</small>
                </div>

                <div className="mb-4 d-flex flex-column flex-md-row gap-3">
                    <div className="flex-fill">
                        <label className="form-label">日付（任意）</label>
                        <input
                            type="date"
                            className="form-control"
                            name="date"
                            value={form.date}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="flex-fill">
                        <label className="form-label">時間（任意）</label>
                        <input
                            type="time"
                            className="form-control"
                            name="time"
                            value={form.time}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <button type="submit" className="Walk-btn w-100" disabled={loading}>
                    {loading ? "投稿中..." : "🐕 掲示板に投稿する"}
                </button>
            </form>
        </div>
    );
};

export default WalkRequestForm;
