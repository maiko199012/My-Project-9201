import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// CodeNow Next App のアーキテクチャ鉄則を機械的に強制する。
// 詳細は CLAUDE.md を参照。
const codenowRules = {
  rules: {
    // 1) Server Actions 禁止: "use server" ディレクティブを検出
    "no-restricted-syntax": [
      "error",
      {
        selector:
          "ExpressionStatement > Literal[value='use server'], ExpressionStatement > DirectiveLiteral[value='use server']",
        message:
          "Server Actions は禁止です。/api/* 経由でデータ取得・変更を行ってください (CLAUDE.md 参照)。",
      },
    ],

    // 2) Client から Supabase ブラウザクライアント直接呼び出し禁止
    //    (auth ページと Header の logout は overrides で個別許可)
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "@/lib/supabase/client",
            message:
              "Client Component から Supabase を直接呼ばないでください。/api/* 経由で取得・変更します。認証 (Google OAuth ログイン / ログアウト) のみ例外で、その場合はこのルールを上書きしている許可リストのファイルで作業してください (CLAUDE.md 参照)。",
          },
        ],
        patterns: [
          {
            group: ["**/lib/supabase/client"],
            message:
              "Client Component から Supabase を直接呼ばないでください。/api/* 経由で取得・変更します。認証 (Google OAuth ログイン / ログアウト) のみ例外です (CLAUDE.md 参照)。",
          },
        ],
      },
    ],
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  codenowRules,

  // 認証フローのみ Supabase ブラウザクライアントの直接利用を許可
  // (login: Google OAuth signInWithOAuth, Header: signOut)
  {
    files: [
      "src/app/(auth)/login/page.tsx",
      "src/components/layout/Header.tsx",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
