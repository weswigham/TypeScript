// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
	"lint": { "rules": { "sort-vars": "warn" } }
}
// @filename: input.ts

var zebra = 1, alpha = 2, middle = 3;
let later = compute(), earlier = 0;
const [last, first] = source;