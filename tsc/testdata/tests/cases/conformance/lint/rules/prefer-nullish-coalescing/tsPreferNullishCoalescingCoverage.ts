// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "strict": true, "target": "esnext", "module": "preserve" },
    "lint": { "rules": { "@typescript-eslint/prefer-nullish-coalescing": ["error", { "ignoreConditionalTests": true }] } },
    "files": ["input.ts"]
}

// @filename: input.ts
declare const nullable: string | null;
const logical = nullable || "default";
const conditional = nullable == null ? "default" : nullable;

declare let mutable: string | null;
mutable ||= "default";

const coalesced = nullable ?? "default";
declare const text: string;
const emptyStringFallback = text || "default";
if (nullable || "default") {}