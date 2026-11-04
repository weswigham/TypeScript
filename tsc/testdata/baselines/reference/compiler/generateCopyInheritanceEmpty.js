//// [tests/cases/compiler/generateCopyInheritanceEmpty.ts] ////

//// [generator.json]
{
    "generate": [{
        "inputs": ["missing.ts"],
        "outputs": ["discarded.ts"],
        "command": ["copy", "${inputs}", "discarded.ts"]
    }]
}

//// [main.ts]
export const value = 42;

//// [main.js]
export const value = 42;
