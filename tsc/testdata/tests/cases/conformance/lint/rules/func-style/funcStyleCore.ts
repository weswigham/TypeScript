// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "func-style": ["error", "expression", { "overrides": { "namedExports": "ignore" } }] } },
    "files": ["input.ts"]
}
// @filename: input.ts
function declaration() {}
const expression = function() {};
const arrow = () => 1;
export function named() {}
export default function() {}
function overloaded(value: number): void;
function overloaded(value: unknown) {}