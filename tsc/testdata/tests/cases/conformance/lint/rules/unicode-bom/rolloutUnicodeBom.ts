// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
	"lint": { "rules": { "unicode-bom": ["warn", "always"] } }
}
// @filename: input.ts

const value = 123;