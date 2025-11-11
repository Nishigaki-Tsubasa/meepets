import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { FaVenus, FaMars, FaGenderless, FaPaw, FaComments } from 'react-icons/fa';

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
        <div className="container mt-5" style={{ maxWidth: 700 }}>
            <button
                type="button"
                className="btn btn-outline-secondary mb-4"
                onClick={() => navigate(-1)}
            >
                &larr; 戻る
            </button>

            <h2 className="text-center fw-bold mb-5">ユーザープロフィール</h2>

            <button
                className="btn MyMatched-btn2 btn-sm d-flex align-items-center gap-1"
                onClick={() => navigate(`/home/chatStart/${profile.uid}`)}
            >
                <FaComments /> <span className="btn-text">チャット</span>
            </button>

            {/* 飼い主情報 */}
            <div className="card mb-4 p-3 shadow-sm">
                <div className="d-flex align-items-center">
                    {profile.owner?.ownerImageURL ? (
                        <img
                            src={profile.owner.ownerImageURL}
                            alt="飼い主"
                            className="rounded-circle me-4"
                            style={{ width: 100, height: 100, objectFit: 'cover' }}
                        />
                    ) : (
                        <div
                            className="rounded-circle bg-secondary me-4"
                            style={{ width: 100, height: 100 }}
                        />
                    )}
                    <div>
                        <h4 className="fw-bold mb-2">{profile.owner?.username || '未設定'}</h4>
                        <p className="mb-1">{genderDisplay(profile.owner?.gender)}</p>
                        <p className="mb-1">自己紹介:</p>
                        <div className="p-2 bg-light rounded" style={{ whiteSpace: 'pre-line' }}>
                            {profile.owner?.intro || '未記入'}
                        </div>
                    </div>
                </div>
            </div>

            {/* ペット情報 */}
            {profile.pet && (
                <div className="card mb-4 p-3 shadow-sm">
                    <div className="d-flex align-items-center mb-3">
                        {profile.pet.petImageURL ? (
                            <img
                                src={profile.pet.petImageURL}
                                alt="ペット"
                                className="rounded me-3"
                                style={{ width: 80, height: 80, objectFit: 'cover' }}
                            />
                        ) : (
                            <div
                                className="rounded bg-secondary me-3"
                                style={{ width: 80, height: 80 }}
                            />
                        )}
                        <h5 className="fw-bold mb-0">{profile.pet.petName || '名無し'}</h5>
                    </div>

                    <ul className="list-group list-group-flush">
                        <li className="list-group-item d-flex justify-content-between">
                            <span>年齢</span>
                            <span>{profile.pet.petAge ?? '未設定'}</span>
                        </li>
                        <li className="list-group-item d-flex justify-content-between">
                            <span>性別</span>
                            <span>{genderDisplay(profile.pet.petGender)}</span>
                        </li>
                        <li className="list-group-item d-flex justify-content-between">
                            <span>品種</span>
                            <span>{profile.pet.breed || '未設定'}</span>
                        </li>
                        {profile.pet.petGender === 'male' && (
                            <li className="list-group-item d-flex justify-content-between">
                                <span>去勢</span>
                                <span>{profile.pet.isNeutered ? 'あり' : 'なし'}</span>
                            </li>
                        )}
                        <li className="list-group-item">
                            <span>紹介:</span>
                            <div className="p-2 bg-light rounded mt-1" style={{ whiteSpace: 'pre-line' }}>
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
