// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "strict": true, "target": "esnext", "module": "preserve" },
    "lint": { "rules": { "@typescript-eslint/strict-boolean-expressions": ["error", { "allowString": false, "allowNumber": false, "allowNullableBoolean": false }] } },
    "files": ["input.ts"]
}

// @filename: input.ts
declare const nullable: boolean | null;
declare const text: string;
declare const count: number;
declare const object: object;

if (nullable) {}
if (text) {}
if (count) {}
if (object) {}

declare const enabled: boolean;
if (enabled) {}
if (nullable === true) {}
if (text.length > 0) {}
if (count !== 0) {}