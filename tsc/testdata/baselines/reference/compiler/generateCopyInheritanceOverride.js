//// [tests/cases/compiler/generateCopyInheritanceOverride.ts] ////

//// [generator.json]
{
    "generate": [{
        "inputs": ["missing.ts"],
        "outputs": ["discarded.ts"],
        "command": ["copy", "${inputs}", "discarded.ts"]
    }]
}

//// [template.ts]
export const value = 42;

//// [value.ts]
export const value = 42;

//// [main.ts]
import { value } from "./generated/value";
export const result = value;

//// [value.js]
export const value = 42;
//// [main.js]
import { value } from "./generated/value";
export const result = value;
