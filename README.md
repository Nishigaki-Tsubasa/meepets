## meepets

デプロイ先URL
https://dog-app-4cb10.web.app/
## 使用技術
- フロントエンド: React (JavaScript)
- バックエンド: Firebase（Firestore + Authentication）
- フレームワーク: Bootstrap
- ビルドツール: Vite
- ホスティング: Firebase Hosting
- パッケージ
├── @eslint/js@9.28.0
├── @tailwindcss/vite@4.1.10
├── @types/react-dom@19.1.6
├── @types/react@19.1.7
├── @vitejs/plugin-react@4.5.2
├── bootstrap@5.3.7
├── date-fns@4.1.0
├── eslint-plugin-react-hooks@5.2.0
├── eslint-plugin-react-refresh@0.4.20
├── eslint@9.28.0
├── firebase@11.9.1
├── framer-motion@12.23.0
├── globals@16.2.0
├── lucide-react@0.516.0
├── react-bootstrap-icons@1.11.6
├── react-bootstrap@2.10.10
├── react-dom@19.1.0
├── react-icons@5.5.0
├── react-router-dom@7.6.2
├── react@19.1.0
├── tailwindcss@4.1.10
├── uuid@11.1.0
└── vite@6.3.5

## 実行環境
- 開発エディター : Visual Studio Code
- OS : Windows 11 Pro 
- 検索エンジン : Google Chrome 

## Node.jsのインストール
https://qiita.com/YurimyMiyu/items/d4fe132fc9bc8189eff4

## firebaseのセットアップ
https://firebase.google.com/

.envファイルを作成し、環境変数を追加
```
VITE_FIREBASE_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_FIREBASE_AUTH_DOMAIN=xxxxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxxxxxxxxxx
VITE_FIREBASE_STORAGE_BUCKET=xxxxxxxxxxxx.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=xxxxxxxxxxxxxxxxxxxxxxx
```

## コマンド
```
git clone https://github.com/Nishigaki-Tsubasa/FoodApp.git
cd　FoodApp
npm i
npm run dev
```
コントロール + C 2回でサーバー停止

http://localhost:5173
をブラウザで開く



