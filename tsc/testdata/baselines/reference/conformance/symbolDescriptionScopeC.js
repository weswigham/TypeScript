//// [tests/cases/conformance/lint/rules/symbol-description/symbolDescriptionScopeC.ts] ////

//// [input.ts]
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

//// [input.ts]
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
