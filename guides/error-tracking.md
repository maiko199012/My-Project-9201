# エラー検知

β期はまず手動確認とログで運用し、必要になったら Sentry などを追加する。

## 見るもの

- 本番で発生した例外
- API Handler の失敗
- 認証コールバックの失敗
- DB 接続や migration の失敗

エラー検知を入れる場合も、API キーや DSN は `.env.local.example` に空値で追加する。
