// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "max-params": ["error", { "max": 2, "countThis": "never" }] } },
    "files": ["input.ts"]
}
// @filename: input.ts
function excessive(first: number, second: number, third: number) {}
function valid(this: object, first: number, second: number) {}
type Excessive = (first: number, second: number, third: number) => void;
declare function declared(first: number, second: number, third: number): void;