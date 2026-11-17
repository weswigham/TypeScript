// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "no-undef-init": "error" } }
}
// @filename: input.ts
var retainedForHoisting = undefined;
let removable = undefined;
let annotated: string | undefined = undefined;
let commented = /* retain */ undefined;
const requiredInitializer = undefined;
function shadowed(undefined: number) {
    let value = undefined;
}
let { destructured } = undefined;