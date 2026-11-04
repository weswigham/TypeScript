//// [tests/cases/compiler/generateCopyInheritanceNull.ts] ////

//// [first.json]
{
    "generate": [{
        "inputs": ["missing.ts"],
        "outputs": ["discarded.ts"],
        "command": ["copy", "${inputs}", "discarded.ts"]
    }]
}

//// [reset.json]
{ "generate": null }

//// [main.ts]
export const value = 42;

//// [main.js]
export const value = 42;
