// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "prefer-object-has-own": "error" } }
}
// @filename: input.ts
Object.prototype.hasOwnProperty.call(object, key);
({}).hasOwnProperty.call(object, key);
(Object.hasOwnProperty.call)(object, key);
Object./* keep */prototype.hasOwnProperty.call(object, key);
function shadowed(Object: any) {
    ({}).hasOwnProperty.call(object, key);
}