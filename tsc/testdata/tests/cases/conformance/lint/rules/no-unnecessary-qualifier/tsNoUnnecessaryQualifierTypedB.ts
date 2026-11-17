// @strict: true
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"strict":true},"lint":{"rules":{"@typescript-eslint/no-unnecessary-qualifier":"error"}}}
// @filename: input.ts
namespace Outer {
    export type Value = number;
    const value: Outer.Value = 1;
    namespace Inner {
        type Value = string;
        const shadowed: Outer.Value = 1;
    }
}
enum Choice { First, Second = Choice.First }