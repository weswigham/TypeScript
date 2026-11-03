//// [tests/cases/compiler/formatCompositeModuleDetection.ts] ////

//// [package.json]
{ "type": "module" }

//// [input.ts]
await
    Promise.resolve({ value: 1 });

//// [input.js]
await Promise.resolve({ value: 1 });
export {};


//// [input.d.ts]
export {};
