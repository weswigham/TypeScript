// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
	"lint": { "rules": { "prefer-object-spread": "error" } }
}
// @filename: input.ts
export {};
const spread = Object.assign({}, source);
const literal = Object.assign({ value: 1 });
const merged = Object.assign({ first: 1 }, { second: 2, /* preserve */ }, source);
const getter = Object.assign({}, { get value() { return 1; } });
const prototype = Object.assign({}, { __proto__: source });
consume()
Object.assign({}, source);
function shadowed(Object: any) { return Object.assign({}, source); }