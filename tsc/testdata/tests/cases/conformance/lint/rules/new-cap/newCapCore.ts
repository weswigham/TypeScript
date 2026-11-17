// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "new-cap": ["error", { "newIsCapExceptions": ["allowed"], "capIsNewExceptionPattern": "^Allowed$" }] } },
    "files": ["input.ts"]
}
// @filename: input.ts
new lower();
Upper();
new Upper();
lower();
new allowed();
Allowed();
Array();
Date.UTC(2000, 0);
object.Upper();
function shadow(Array: Function) { Array(); }