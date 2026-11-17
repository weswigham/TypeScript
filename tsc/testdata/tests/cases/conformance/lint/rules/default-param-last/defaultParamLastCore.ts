// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "default-param-last": "error" } },
    "files": ["input.ts"]
}
// @filename: input.ts
function invalid(first = 1, second: number) {}
function optional(first?: number, second: number) {}
function valid(first = 1, ...rest: number[]) {}