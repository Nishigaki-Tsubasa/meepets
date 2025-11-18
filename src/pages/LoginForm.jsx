import { useState } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import '../colors.js';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [hover, setHover] = useState(false);


    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            const userRef = doc(db, 'users', result.user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists() && userSnap.data().firstcreated) {
                navigate('/profile');
            } else {
                navigate('/home');
            }
        } catch (err) {
            setError('ログイン失敗: メールアドレスまたはパスワードが間違っています。');
        }
    };

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const userRef = doc(db, 'users', result.user.uid);
            const snap = await getDoc(userRef);

            if (!snap.exists()) {
                await setDoc(userRef, {
                    uid: result.user.uid,
                    email: result.user.email,
                    displayName: result.user.displayName || '',
                    createdAt: serverTimestamp(),
                    firstcreated: true,
                });
                navigate('/profile');
            } else if (snap.data().firstcreated) {
                navigate('/profile');
            } else {
                navigate('/home');
            }
        } catch (err) {
            console.error('Googleログイン失敗:', err);
        }
    };

    return (
        <div
            className="login-container"
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#f8f9fa',
            }}
        >
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
                .login-card {
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
                .login-link {
                    color: #ff9e5e;
                    text-decoration: underline;
                    cursor: pointer;
                }
                @media (min-width: 576px) {
                    h1 {
                        font-size: 90px;
                    }
                    h2 {
                        font-size: 30px;
                    }
                    .login-card {
                        width: 100%;
                    }
                }
            `}</style>

            {/* アプリ名 */}
            <header className="mb-4 w-100 text-center">
                <h1>meepets</h1>
            </header>

            {/* ログインカード */}
            <div className="login-card">
                <h2>ログイン</h2>

                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleLogin}>
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">メールアドレス</label>
                        <input
                            type="email"
                            id="email"
                            className="form-control form-control-lg rounded-pill"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="password" className="form-label">パスワード</label>
                        <input
                            type="password"
                            id="password"
                            className="form-control form-control-lg rounded-pill"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn Login-btn2 btn-lg w-100 rounded-pill shadow-sm"
                        style={{
                            color: hover ? '#fff' : '#ff6f61',
                            backgroundColor: hover ? '#ff6f61' : '#fff',
                            transition: 'all 0.3s ease',
                            border: `1px solid ${hover ? '#ff6f61' : '#ff6f61'}`,

                        }}
                        onMouseEnter={() => setHover(true)}
                        onMouseLeave={() => setHover(false)}
                    >
                        ログイン
                    </button>
                </form>

                <div className="d-grid mt-3">
                    <button
                        type="button"
                        className="btn btn-outline-primary btn-lg rounded-pill shadow-sm d-flex align-items-center justify-content-center gap-2"
                        onClick={handleGoogleLogin}
                    >
                        <img
                            src="https://developers.google.com/identity/images/g-logo.png"
                            alt="Googleロゴ"
                            style={{ width: 20, height: 20 }}
                        />
                        <span>Googleでログイン</span>
                    </button>
                </div>

                <div className="d-grid mt-3 text-center login-footer">
                    <small>
                        アカウントをお持ちでない方は{' '}
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={() => navigate('/register')}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
                            }}
                            className="login-link"
                        >
                            新規登録
                        </span>
                    </small>
                    <br />
                    {/* <small>
                        アプリの使い方{' '}
                        <a
                            href="https://v0-remix-of-meeple-app-documentati.vercel.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="login-link"
                        >
                            こちら
                        </a>
                    </small> */}
                </div>
            </div>
        </div>



    );
}

export default Login;
