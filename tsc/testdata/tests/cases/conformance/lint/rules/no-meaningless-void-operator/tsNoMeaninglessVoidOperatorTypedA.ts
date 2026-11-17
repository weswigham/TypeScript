// @strict: true
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
	"lint": { "rules": { "@typescript-eslint/no-meaningless-void-operator": ["error", { "checkNever": true }] } }
}
// @filename: input.ts

declare function nothing(): void;
declare function fail(): never;
declare function value(): string;
declare const promise: Promise<number>;
void nothing();
void fail();
void value();
void promise;
void 0;
void 1;
const result = void "value";
let assigned: number;
() => void (assigned = 1);