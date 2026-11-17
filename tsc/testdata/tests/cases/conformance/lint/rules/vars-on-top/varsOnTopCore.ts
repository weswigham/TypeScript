// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "vars-on-top": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
import foo from "foo";
"directive";
var first;
export var second;
work();
var late;
function method() {
    "directive";
    let first;
    var second;
    if (first) { var nested; }
    for (var index = 0;;) {}
}
class Example { static { "not directive"; var late; } }