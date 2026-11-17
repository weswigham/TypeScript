// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "no-undef": "error" } }
}
// @filename: input.ts
unknown;
typeof safe;
known.property;
const object = { shorthand };
function parameterDefault(value = body) {
    var body;
    return arguments;
}
try {} catch ({ message }) { message; }
message;