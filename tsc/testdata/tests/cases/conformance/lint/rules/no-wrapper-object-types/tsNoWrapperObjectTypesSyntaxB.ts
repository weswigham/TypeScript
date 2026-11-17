// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
	"lint": { "rules": { "@typescript-eslint/no-wrapper-object-types": "error" } }
}
// @filename: input.ts
let wrapped: Number;
let primitive: number;
interface Wrapped extends String {}
const conversion = Number(1);