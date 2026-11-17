// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "dot-notation": ["error", { "allowPattern": "^allowed$" }] } },
    "files": ["input.ts"]
}
// @filename: input.ts
object["name"];
object[`value`];
object?.["optional"];
object[/* Keep */ "commented"];
object["allowed"];
object["with space"];
object[true];
object[null];