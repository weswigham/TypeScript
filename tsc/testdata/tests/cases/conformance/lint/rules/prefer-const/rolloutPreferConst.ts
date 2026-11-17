// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
	"lint": { "rules": { "prefer-const": "error" } }
}
// @filename: input.ts
export {};
let /* preserve */ value = 1;
let changed = 1;
changed++;
let { first, second } = source;
second++;
let assignedLater;
assignedLater = 1;
for (let item of values) consume(item);
for (let index = 0; index < 3; index++) consume(index);