// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "func-names": ["error", "as-needed", { "generators": "always" }] } },
    "files": ["input.ts"]
}
// @filename: input.ts
const inferred = function() {};
object.method = function() {};
use(function() {});
const generator = function*() {};
class Example { field = function() {}; method() {} }
export default function() {}