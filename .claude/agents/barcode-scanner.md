# バーコードスキャン機能エージェント

## 概要
スマートフォンのカメラでバーコードをスキャンして食材情報を自動入力する機能を実装するエージェント

## 担当Issue
GitHub Issue #3: バーコードスキャン機能

## 実装タスク

### 1. パッケージインストール
```bash
npm install @zxing/library @zxing/browser
# または
npm install quagga2
```

### 2. 商品情報API設定
- [ ] Yahoo!ショッピングAPI または 楽天商品検索API のアカウント作成
- [ ] API キーの取得と環境変数設定

### 3. バックエンド実装（Supabase Edge Function）
- [ ] functions/lookup-barcode/index.ts
  - バーコードから商品情報を検索
  - 複数APIのフォールバック対応
  - 検索結果のキャッシュ

```sql
-- 商品情報キャッシュテーブル
CREATE TABLE product_cache (
    barcode VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255),
    category_suggestion VARCHAR(50),
    image_url TEXT,
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 4. フロントエンド実装
- [ ] components/BarcodeScanner.tsx
  - カメラプレビュー表示
  - スキャン領域のガイド表示
  - スキャン結果のコールバック
- [ ] services/barcodeService.ts
  - lookupBarcode(code)
  - startScanner()
  - stopScanner()
- [ ] hooks/useBarcodeScanner.ts

### 5. UI/UX
- [ ] 食材追加画面にスキャンボタン追加
- [ ] スキャン画面のモーダル表示
- [ ] スキャン成功時のフィードバック
- [ ] 商品が見つからない場合のUI
- [ ] カメラ切り替え（前面/背面）

### 6. PWA対応
- [ ] カメラアクセス許可の処理
- [ ] HTTPS必須の確認
- [ ] manifest.json の更新

## 技術的考慮事項
- カメラアクセスはHTTPS必須
- モバイルブラウザの互換性
- バーコード形式: JAN/EAN-13, JAN/EAN-8, UPC-A
- API利用制限とレート制限

## 依存関係
- @zxing/library または quagga2
- 商品情報API

## 環境変数
```
YAHOO_APP_ID=xxx
# または
RAKUTEN_APP_ID=xxx
```

## テスト項目
- [ ] カメラ起動
- [ ] バーコード読み取り（複数形式）
- [ ] 商品情報の取得
- [ ] フォームへの自動入力
- [ ] エラーハンドリング（API失敗、商品未登録）
- [ ] 異なるデバイスでの動作確認
