// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "radix": "error" } }
}
// @filename: input.ts
parseInt();
parseInt("10");
Number.parseInt("10", 1);
parseInt("10", undefined);
parseInt("10", +37);
parseInt("10", 2);
Number.parseInt("10", 36);
function shadowed(parseInt: any, Number: any) {
    parseInt("10");
    Number.parseInt("10");
}