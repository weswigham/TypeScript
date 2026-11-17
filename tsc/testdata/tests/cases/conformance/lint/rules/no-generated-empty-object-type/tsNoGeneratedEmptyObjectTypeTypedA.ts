// @strict: true
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
	"lint": { "rules": { "@typescript-eslint/no-generated-empty-object-type": "error" } }
}
// @filename: input.ts

type Empty = Pick<{ value: string }, never>;
type EmptyRecord = Record<never, unknown>;
type EmptyIntersection = {} & {};
type Explicit = {};
type Generic<T extends string> = Record<T, unknown>;
interface EmptyInterface<T> {}
type InterfaceAlias = EmptyInterface<string>;