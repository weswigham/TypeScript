//// [tests/cases/compiler/generateCopyInheritance.ts] ////

//// [first.json]
{
    "generate": [{
        "inputs": ["missing.ts"],
        "outputs": ["discarded.ts"],
        "command": ["copy", "${inputs}", "discarded.ts"]
    }]
}

//// [middle.json]
{ "extends": "./generator.json" }

//// [generator.json]
{
    "generate": [{
        "inputs": ["template.ts"],
        "outputs": ["generated/value.ts"],
        "command": ["copy", "${inputs}", "generated/value.ts"]
    }]
}

//// [template.ts]
export const value = 42;

//// [value.ts]
export const value = 42;

//// [main.ts]
import { value } from "./base/generated/value";
export const result = value;

//// [value.js]
export const value = 42;
//// [main.js]
import { value } from "./base/generated/value";
export const result = value;


//// [value.d.ts]
export declare const value = 42;
//// [main.d.ts]
export declare const result = 42;
