// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
	"lint": { "rules": { "prefer-arrow-callback": "error" } }
}
// @filename: input.ts
export {};
consume(function(value: number): number { return value; });
consume(function named() {});
consume(function /* preserve */ () {});
consume(function() { return this.value; }.bind(this));
consume(function recursive() { recursive(); });
consume(function() { return arguments; });
consume(function() { return this; });