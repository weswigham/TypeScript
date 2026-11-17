// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": {
        "rules": {
            "no-debugger": "error",
            "no-console": "warning"
        }
    },
    "files": ["input.ts"]
}
// @filename: input.ts
const value: number = "text";
debugger;
console.log(value);
