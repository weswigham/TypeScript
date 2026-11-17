// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "logical-assignment-operators": ["warn", "always", { "enforceForIfStatements": true }] } }
}
// @filename: input.ts

let value, fallback;
value = value || fallback;
object.value = object.value ?? fallback;
object.value || (object.value = fallback);
if (value == null) {
    value = fallback;
}
if (object.deep.value) object.deep.value = fallback;
value = value || /* keep */ fallback;