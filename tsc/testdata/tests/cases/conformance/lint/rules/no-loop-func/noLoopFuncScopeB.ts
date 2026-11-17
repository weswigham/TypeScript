// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-loop-func":"error"}},"files":["input.ts"]}
// @filename: input.ts
for (var index = 0; index < 3; index++) {
    const unsafe = () => index;
    (() => index)();
    (() => { return () => index; })();
    (async () => index)();
}
for (let index = 0; index < 3; index++) {
    const safe = () => index;
}
const stable = 0;
while (ready) { () => stable; }
let mutable;
function update() { mutable = 1; }
while (ready) { () => mutable; }