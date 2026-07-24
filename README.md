# Pet Saver - 貯金をゲーム化するアプリ

PHP + MySQL + React + Vite を採用した、フルスタックの貯金ゲーム化アプリケーションです。

## 特徴

- **アバター付きの貯金目標**: 犬、猫、鳥、ウサギ、ブタなどのペットアバターを選択し、楽しく貯金目標を設定できます。
- **日々の取引管理**: クイック入力スクロール機能により、貯金（デポジット）と支出を簡単に記録できます。
- **ペットアバターのリアクション**: 貯金の進捗状況に応じて、ペットの感情が変化します（嬉しい、悲しい、汚れる、お祝いなど）。
- **ランクシステム**: 貯金の実績に応じて、ブロンズ → シルバー → ゴールド → ダイヤモンド → プラチナへとランクアップします。
- **コイン経済とショップ**: 貯金やクエスト達成で手に入れたコインを使って、ショップでペットのアバターや着せ替えアイテムを購入できます。
- **レシートスキャナー (Gemini AI)**: レシートの写真をアップロードするだけで、店舗名、合計金額、日付をAIが自動検出し、支出を自動記録します。
- **お世話機能**: 貯金するだけでなく、ペットに「ごはん」や「お風呂」などのアクションでお世話をしてレベルアップさせることができます。
- **連続記録（ストリーク）と実績バッジ**: 毎日コツコツ続けることでストリークが維持され、様々なアチーブメントバッジをアンロックできます。
- **多言語対応**: 日本語、英語、ミャンマー語の３つの言語に対応しています。

## プロジェクト構成

```
pet_saver/
├── api/                  # PHP バックエンド API
│   ├── .env              # データベース・JWT等の環境変数設定
│   ├── .env.example      # 環境変数のテンプレート
│   ├── .htaccess         # ApacheのCORSとリライト設定
│   ├── config.php        # データベース接続とJWTの設定
│   └── index.php         # APIルーターと各エンドポイント
├── database/
│   └── schema.sql        # MySQLデータベースのテーブルスキーマ
├── frontend/             # React + Vite フロントエンド
│   ├── .env              # フロントエンド環境変数（APIのURL設定）
│   ├── .env.example      # 環境変数のテンプレート
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── App.css
│       ├── api.js
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── components/
│       │   └── Sidebar.jsx
│       └── pages/
│           ├── Login.jsx
│           ├── Dashboard.jsx
│           ├── Goals.jsx
│           ├── Transactions.jsx
│           ├── Shop.jsx
│           ├── Achievements.jsx
│           ├── ReceiptScanner.jsx
│           ├── Rankings.jsx
│           └── Settings.jsx
```

## クイックスタート

### 1. データベースのセットアップ

```bash
mysql -u root -p
CREATE DATABASE pet_saver CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
mysql -u root -p pet_saver < database/schema.sql
```

### 2. バックエンドのセットアップ (PHP)

1. `api/` ディレクトリをWebサーバーのルート配下にコピーします。
   - XAMPPの場合: `C:\xampp\htdocs\pet_saver\api\`
   - MAMPの場合: `/Applications/MAMP/htdocs/pet_saver/api/`

2. `.env` ファイルの設定を行います。
   ```bash
   cd api/
   cp .env.example .env
   ```
   `api/.env` をエディタで開き、自身の環境に合わせて修正します:
   ```ini
   DB_HOST=localhost
   DB_NAME=pet_saver
   DB_USER=root
   DB_PASS=your_password          # データベースのパスワード
   JWT_SECRET=your_secret_key     # 任意のランダムな文字列を設定
   GEMINI_API_KEY=your_gemini_key # レシートスキャン用のGemini APIキー
   ```

3. Apache モジュールを有効化します。
   - `httpd.conf` を開き、以下の２つのモジュールが有効（コメントアウト解除）になっていることを確認します。
     - `LoadModule rewrite_module`
     - `LoadModule headers_module`
   - 設定後、Apacheを再起動します。

4. 接続の確認: ブラウザで `http://localhost/pet_saver/api/auth/login` にアクセスし、JSONのレスポンスが返ってくれば正常に動作しています。

### 3. フロントエンドのセットアップ (React + Vite)

```bash
cd frontend/
npm install
```

API接続先URLの設定:
```bash
cp .env .env.local
```
`frontend/.env.local` を開き、自身のローカルサーバーに合わせて設定します:
```ini
# XAMPP / WAMP を使用する場合 (ポート番号: 80)
VITE_API_URL=http://localhost/pet_saver/api

# MAMP を使用する場合 (ポート番号: 8888)
# VITE_API_URL=http://localhost:8888/pet_saver/api
```

開発用サーバーの起動:
```bash
npm run dev
```
ブラウザで `http://localhost:3000` にアクセスしてアプリを開きます。

## トラブルシューティング

### 「Network error」または「Failed to fetch」と表示される場合

1. バックエンドサーバーが起動しているか確認します: `http://localhost/pet_saver/api/auth/login` にブラウザでアクセスして確認。
2. CORSエラーがないか確認します: `.htaccess` がCORS処理を自動で行います。
3. `frontend/.env.local` の `VITE_API_URL` がサーバーの正しいURLを指しているか確認します。
   | サーバー種類 | URLの例 |
   |--------------|---------|
   | XAMPP | `http://localhost/pet_saver/api` |
   | MAMP | `http://localhost:8888/pet_saver/api` |
   | WAMP | `http://localhost/pet_saver/api` |

### 「Database connection failed」と表示される場合

1. MySQLサーバーが起動しているか確認します。
2. `api/.env` の `DB_PASS` が正しいか確認します。
3. ターミナルからテストします: `mysql -u root -p -e "USE pet_saver; SHOW TABLES;"`

## 主な API エンドポイント

| エンドポイント | メソッド | 説明 |
|----------------|----------|------|
| `/auth/register` | POST | 新規会員登録 |
| `/auth/login` | POST | ログイン |
| `/user` | GET/PUT | ユーザープロファイル・更新 |
| `/dashboard` | GET | ダッシュボード用データ取得 |
| `/targets` | GET/POST | 目標（ペットアバター）管理 |
| `/transactions` | GET/POST | 取引（貯金・支出）の記録 |
| `/avatars/care` | POST | ペットのお世話（ごはん、風呂など） |
| `/shop` | GET | ショップのアイテム一覧 |
| `/shop/buy` | POST | アバター・アクセサリーの購入 |
| `/receipts/scan` | POST | Gemini AIによるレシートスキャン処理 |
| `/rankings` | GET | リーダーボード（順位） |

## セキュリティ対策

- **JWT認証**: 安全なセッション管理
- **Bcrypt**: パスワードの強力なハッシュ化
- **プリペアドステートメント**: SQLインジェクション攻撃の防止
- **注意**: 環境変数ファイルである `.env` は決して公開リポジトリ（GitHubなど）へコミットしないでください。

## ライセンス

MIT License
