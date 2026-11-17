// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "no-undefined": "error" } }
}
// @filename: input.ts
let value = undefined;
function shadowed(undefined: number) {
    return undefined;
}
const object = { undefined: 0 };
object.undefined;
const shorthand = { undefined };
type Optional = number | undefined;