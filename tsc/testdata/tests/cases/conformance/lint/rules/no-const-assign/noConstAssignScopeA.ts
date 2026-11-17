// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-const-assign": "error" } },
    "files": ["input.ts"]
}
// @filename: input.ts
const constant = 0;
constant++;
({ constant } = value);
({ key: constant = 1 } = value);
[...constant] = value;
using resource = createResource();
resource = value;
for (const key of values) { use(key); }
function shadow(constant: number) { constant = 1; }