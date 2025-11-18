import React, { useState } from "react";
import { db, storage } from "../firebase/firebase";
import { getAuth } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { FaDog, FaPaperPlane } from "react-icons/fa";

const prefectures = [
    "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
    "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
    "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
    "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
    "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
    "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
    "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

const AdoptionForm = () => {
    const [formData, setFormData] = useState({
        name: "", gender: "", age: "", size: "", breed: "",
        hasDisease: "", vaccine: "", introduction: "", area: "", image: null
    });
    const [uploading, setUploading] = useState(false);
    const navigate = useNavigate();
    const auth = getAuth();

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (files) {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return alert("ログインが必要です");

        setUploading(true);
        try {
            let imageURL = "";
            if (formData.image) {
                const imageRef = ref(storage, `adoptionImages/${user.uid}_${Date.now()}`);
                await uploadBytes(imageRef, formData.image);
                imageURL = await getDownloadURL(imageRef);
            }

            await addDoc(collection(db, "adoptionPosts"), {
                uid: user.uid,
                name: formData.name,
                gender: formData.gender,
                age: formData.age,
                size: formData.size,
                breed: formData.breed,
                hasDisease: formData.hasDisease,
                vaccine: formData.vaccine,
                introduction: formData.introduction,
                area: formData.area,
                imageURL,
                likes: [],
                comments: [],
                createdAt: serverTimestamp(),
            });

            navigate("/home/AdoptionBoard");
        } catch (err) {
            console.error("投稿エラー:", err);
            alert("投稿に失敗しました。");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="container py-4">
            <style>{`
        .form-card {
          max-width: 650px;
          margin: auto;
          background: #fff;
          border-radius: 1rem;
          padding: 2rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .form-title {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #ff6f61;
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 1.5rem;
        }
        .form-label {
          font-weight: 600;
          color: #555;
          font-size: 1rem;
        }
        .form-control, .form-select, textarea {
          font-size: 1rem;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
        }
        .submit-btn {
          background-color: #ff6f61;
          border: none;
          color: #fff;
          font-weight: 600;
          font-size: 1rem;
          border-radius: 0.6rem;
          padding: 0.6rem 0;
          transition: all 0.3s ease;
        }
        .submit-btn:hover:not(:disabled) {
          background-color: #e55b50;
          transform: translateY(-1px);
        }
        .submit-btn:disabled {
          background: #f7a79c;
          cursor: not-allowed;
        }
      `}</style>

            <div className="form-card">
                <h3 className="form-title">
                    <FaDog /> いぬの里親募集フォーム
                </h3>

                <form onSubmit={handleSubmit}>
                    {/* 名前 */}
                    <div className="mb-3">
                        <label className="form-label">名前</label>
                        <input type="text" name="name" className="form-control" value={formData.name} onChange={handleChange} required />
                    </div>

                    {/* 性別 */}
                    <div className="mb-3">
                        <label className="form-label">性別</label>
                        <select name="gender" className="form-select" value={formData.gender} onChange={handleChange} required>
                            <option value="">選択してください</option>
                            <option value="オス">オス</option>
                            <option value="メス">メス</option>
                        </select>
                    </div>

                    {/* 年齢 */}
                    <div className="mb-3">
                        <label className="form-label">年齢</label>
                        <input type="number" name="age" className="form-control" min="0" value={formData.age} onChange={handleChange} placeholder="例：2（歳）" required />
                    </div>

                    {/* サイズ */}
                    <div className="mb-3">
                        <label className="form-label">サイズ</label>
                        <select name="size" className="form-select" value={formData.size} onChange={handleChange}>
                            <option value="">選択してください</option>
                            <option value="小型犬">小型犬</option>
                            <option value="中型犬">中型犬</option>
                            <option value="大型犬">大型犬</option>
                        </select>
                    </div>

                    {/* 犬種 */}
                    <div className="mb-3">
                        <label className="form-label">犬種</label>
                        <input type="text" name="breed" className="form-control" value={formData.breed} onChange={handleChange} required />
                    </div>

                    {/* 地域 */}
                    <div className="mb-3">
                        <label className="form-label">地域（都道府県）</label>
                        <select name="area" className="form-select" value={formData.area} onChange={handleChange} required>
                            <option value="">選択してください</option>
                            {prefectures.map((pref, i) => (<option key={i} value={pref}>{pref}</option>))}
                        </select>
                    </div>

                    {/* 持病 */}
                    <div className="mb-3">
                        <label className="form-label">持病の有無</label>
                        <input type="text" name="hasDisease" className="form-control" value={formData.hasDisease} onChange={handleChange} placeholder="例：なし / 皮膚病の治療中" />
                    </div>

                    {/* ワクチン */}
                    <div className="mb-3">
                        <label className="form-label">ワクチン</label>
                        <select name="vaccine" className="form-select" value={formData.vaccine} onChange={handleChange}>
                            <option value="">選択してください</option>
                            <option value="接種済み">接種済み</option>
                            <option value="未接種">未接種</option>
                            <option value="不明">不明</option>
                        </select>
                    </div>

                    {/* 自己紹介 */}
                    <div className="mb-3">
                        <label className="form-label">自己紹介</label>
                        <textarea name="introduction" className="form-control" rows="4" value={formData.introduction} onChange={handleChange} placeholder="性格や好きなことなど"></textarea>
                    </div>

                    {/* 画像 */}
                    <div className="mb-4">
                        <label className="form-label">画像をアップロード</label>
                        <input type="file" name="image" accept="image/*" className="form-control" onChange={handleChange} />
                    </div>

                    <button type="submit" className="btn submit-btn w-100" disabled={uploading}>
                        {uploading ? "投稿中..." : <><FaPaperPlane /> 投稿する</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdoptionForm;
