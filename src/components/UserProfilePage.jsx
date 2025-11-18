import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { FaVenus, FaMars, FaGenderless, FaComments } from 'react-icons/fa';

const UserProfilePage = () => {
    const { uid } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const docRef = doc(db, 'users', uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setProfile(docSnap.data());
                } else {
                    setProfile(null);
                }
            } catch (error) {
                console.error('プロフィール取得エラー:', error);
                setProfile(null);
            }
            setLoading(false);
        };
        fetchProfile();
    }, [uid]);

    const genderDisplay = (gender) => {
        switch (gender) {
            case 'man':
            case 'male':
                return <span><FaMars className="me-1 text-primary" />男性</span>;
            case 'woman':
            case 'female':
                return <span><FaVenus className="me-1 text-danger" />女性</span>;
            case 'other':
                return <span><FaGenderless className="me-1 text-secondary" />その他</span>;
            default:
                return '未設定';
        }
    };

    if (loading) return <p className="mt-5 text-center text-muted">読み込み中...</p>;
    if (!profile) return <p className="mt-5 text-center text-muted">プロフィールが見つかりませんでした。</p>;

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

            <h2 style={{ textAlign: "center", fontWeight: 700, marginBottom: "2rem" }}>ユーザープロフィール</h2>

            {/* 飼い主情報カード */}
            <div style={{
                backgroundColor: "#fffef9",
                borderRadius: "1rem",
                padding: "1.5rem",
                boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                maxWidth: "700px",
                margin: "0 auto 2rem auto",
                position: "relative"
            }}>
                <button
                    onClick={() => navigate(`/home/chatStart/${profile.uid}`)}
                    style={{
                        position: "absolute",
                        top: "1rem",
                        right: "1rem",
                        background: "#0d6efd",
                        color: "#fff",
                        border: "none",
                        borderRadius: "50px",
                        padding: "0.4rem 1rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(13,110,253,0.25)"
                    }}
                >
                    <FaComments /> チャット
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <img
                        src={profile.owner?.ownerImageURL || "/riku.png"}
                        alt="飼い主"
                        style={{
                            width: "110px",
                            height: "110px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "3px solid #fff",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                        }}
                    />
                    <div>
                        <h4 style={{ fontWeight: 700, marginBottom: "0.3rem" }}>{profile.owner?.username || '未設定'}</h4>
                        <div style={{ marginBottom: "0.5rem" }}>{genderDisplay(profile.owner?.gender)}</div>
                        <p style={{ fontWeight: 600, marginBottom: "0.2rem" }}>自己紹介</p>
                        <div style={{
                            background: "#fff",
                            padding: "0.5rem 0.8rem",
                            borderRadius: "0.5rem",
                            whiteSpace: "pre-line",
                            color: "#555"
                        }}>
                            {profile.owner?.intro || '未記入'}
                        </div>
                    </div>
                </div>
            </div>

            {/* ペット情報カード */}
            {profile.pet && (
                <div style={{
                    backgroundColor: "#fffef9",
                    borderRadius: "1rem",
                    padding: "1.5rem",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                    maxWidth: "700px",
                    margin: "0 auto 2rem auto"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                        <img
                            src={profile.pet.petImageURL || "/images.jpg"}
                            alt="ペット"
                            style={{
                                width: "90px",
                                height: "90px",
                                borderRadius: "12px",
                                objectFit: "cover"
                            }}
                        />
                        <h5 style={{ fontWeight: 700, marginBottom: 0 }}>{profile.pet.petName || '名無し'}</h5>
                    </div>

                    <ul style={{ listStyle: "none", padding: 0, margin: 0, color: "#555" }}>
                        <li style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0" }}>
                            <span>年齢</span>
                            <span>{profile.pet.petAge ?? '未設定'}</span>
                        </li>
                        <li style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0" }}>
                            <span>性別</span>
                            <span>{genderDisplay(profile.pet.petGender)}</span>
                        </li>
                        <li style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0" }}>
                            <span>品種</span>
                            <span>{profile.pet.breed || '未設定'}</span>
                        </li>
                        {profile.pet.petGender === 'male' && (
                            <li style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0" }}>
                                <span>去勢</span>
                                <span>{profile.pet.isNeutered ? 'あり' : 'なし'}</span>
                            </li>
                        )}
                        <li style={{ marginTop: "0.5rem" }}>
                            <span style={{ fontWeight: 600 }}>紹介</span>
                            <div style={{
                                background: "#fff",
                                padding: "0.5rem",
                                borderRadius: "0.5rem",
                                marginTop: "0.3rem",
                                whiteSpace: "pre-line"
                            }}>
                                {profile.pet.petIntro || '未設定'}
                            </div>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default UserProfilePage;
