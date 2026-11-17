// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
	"lint": { "rules": { "sort-keys": ["warn", "asc", { "natural": true, "caseSensitive": false, "ignoreComputedKeys": true, "allowLineSeparatedGroups": true }] } }
}
// @filename: input.ts

const object = { beta: 1, alpha: 2, ...source, item10: 10, item2: 2 };
const nested = { Z: 1, a: 2 };
const computed = { c: 1, [key]: 2, b: 3 };