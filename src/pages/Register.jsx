import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { useNavigate } from 'react-router-dom';
import '../colors.js';

function Register({ setIsLoginPage }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();
    const [hover, setHover] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password.length < 6) {
            setError('パスワードは6文字以上で入力してください');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;

            await setDoc(doc(db, 'users', uid), {
                email,
                createdAt: serverTimestamp(),
                role: 'user',
                firstcreated: true,
                uid,
            });

            setSuccess('登録に成功しました！');
            setEmail('');
            setPassword('');
            navigate('/profile');
        } catch (err) {
            setError('登録に失敗しました: ' + err.message);
        }
    };

    return (
        <div className="container"
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#f8f9fa'
            }}>

            <style>{`
                h1 {
                    font-size: 10vw;
                    color: #ff6f61;
                    font-family: 'M PLUS Rounded 1c', sans-serif;
                    user-select: none;
                    text-align: center;
                    margin-bottom: 1rem;
                }
                h2 {
                    color: #ff6f61;
                    font-size: 6vw;
                    font-weight: bold;
                    user-select: none;
                    text-align: center;
                    margin-bottom: 1.5rem;
                }
                .card {
                    max-width: 400px;
                    width: 90%;
                    padding: 1.5rem;
                    margin: 0 auto;
                    border-radius: 1rem;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                .btn-lg {
                    font-size: 1rem;
                    padding: 0.5rem 1rem;
                }
                @media (min-width: 576px) {
                    h1 {
                        font-size: 90px;
                    }
                    h2 {
                        font-size: 30px;
                    }
                    .card {
                        width: 100%;
                    }
                }
            `}</style>

            {/* アプリ名 */}
            <header className="mb-4 w-100 text-center">
                <h1>meepets</h1>
            </header>

            {/* 登録カード */}
            <div className="card">
                <h2>新規登録</h2>

                {error && <div className="alert alert-danger">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <form onSubmit={handleRegister}>
                    <div className="mb-3">
                        <label className="form-label">メールアドレス</label>
                        <input
                            type="email"
                            className="form-control form-control-lg rounded-pill"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="form-label">パスワード</label>
                        <input
                            type="password"
                            className="form-control form-control-lg rounded-pill"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        style={{
                            color: hover ? '#fff' : '#ff6f61',
                            backgroundColor: hover ? '#ff6f61' : '#fff',
                            border: `1px solid ${hover ? '#ff6f61' : '#ff6f61'}`,
                            transition: 'all 0.3s ease',
                        }}
                        className="btn Login-btn2 btn-lg w-100 rounded-pill shadow-sm"
                        onMouseEnter={() => setHover(true)}
                        onMouseLeave={() => setHover(false)}
                    >
                        登録する
                    </button>
                </form>

                <div className="text-center mt-4">
                    <small>
                        すでにアカウントをお持ちの方は{' '}
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={() => navigate('/')}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setIsLoginPage(true);
                                }
                            }}
                            style={{
                                color: '#ff9e5e',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                            }}
                        >
                            ログイン
                        </span>
                    </small>
                </div>
            </div>
        </div>
    );
}

export default Register;
