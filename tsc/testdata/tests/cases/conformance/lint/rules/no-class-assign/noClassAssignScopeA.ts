// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-class-assign": "error" } },
    "files": ["input.ts"]
}
// @filename: input.ts
class Example {}
Example = 0;
({ Example } = value);
({ key: Example = 0 } = value);
const Expression = class Named {
    method() { Named = 1; }
};
function shadow(Example: number) { Example++; }