// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "prefer-regex-literals": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
const first = new RegExp("abc", "u");
const second = RegExp(`def`);
const third = RegExp(String.raw`\w+`);
const dynamic = RegExp(pattern);
function shadowed(RegExp: Function) { return RegExp("abc"); }