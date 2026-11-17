// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "symbol-description": "error" } }
}
// @filename: input.ts
Symbol();
Symbol?.();
Symbol("description");
Symbol(undefined);
function shadowed(Symbol: (...args: unknown[]) => symbol) {
    Symbol();
}
{
    const Symbol = () => 0;
    Symbol();
}