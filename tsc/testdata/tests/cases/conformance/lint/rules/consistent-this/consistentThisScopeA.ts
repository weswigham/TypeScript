// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "consistent-this": ["error", "self", "vm"] } },
    "files": ["input.ts"]
}
// @filename: input.ts
var self;
self = this;
var vm = this;
var context = this;
function nested() {
    var self;
    (() => { self = this; })();
}
function assigned() {
    let vm;
    vm = this;
}
vm += this;