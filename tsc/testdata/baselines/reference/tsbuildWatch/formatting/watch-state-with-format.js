currentDirectory::/home/src/workspaces/project
useCaseSensitiveFileNames::true
Input::
//// [/home/src/workspaces/project/base.json] *new* 
{"formattingOptions":{"indentSize":2}}
//// [/home/src/workspaces/project/src/input.ts] *new* 
export function value() {
  return 1;
}

//// [/home/src/workspaces/project/tsconfig.json] *new* 
{"extends":"./base.json","compilerOptions":{"composite":true,"noEmitOnError":true,"outDir":"dist"},"include":["src"]}

tsgo -b . --watch --format
ExitStatus:: Success
Output::
[2J[3J[H[[90mHH:MM:SS AM[0m] Starting compilation in watch mode...

[[90mHH:MM:SS AM[0m] Found 0 errors. Watching for file changes.

//// [/home/src/tslibs/TS/Lib/lib.es2026.full.d.ts] *Lib*
/// <reference no-default-lib="true"/>
interface Boolean {}
interface Function {}
interface CallableFunction {}
interface NewableFunction {}
interface IArguments {}
interface Number { toExponential: any; }
interface Object {}
interface RegExp {}
interface String { charAt: any; }
interface Array<T> { length: number; [n: number]: T; }
interface ReadonlyArray<T> {}
interface SymbolConstructor {
    (desc?: string | number): symbol;
    for(name: string): symbol;
    readonly toStringTag: symbol;
}
declare var Symbol: SymbolConstructor;
interface Symbol {
    readonly [Symbol.toStringTag]: string;
}
declare const console: { log(msg: any): void; };
//// [/home/src/workspaces/project/dist/src/input.d.ts] *new* 
export declare function value(): number;

//// [/home/src/workspaces/project/dist/src/input.js] *new* 
export function value() {
    return 1;
}

//// [/home/src/workspaces/project/dist/tsconfig.tsbuildinfo] *new* 
{"formatting":{"options":"3d9ec6d66b0cbcba9a6936012cbf00a2","files":{"../src/input.ts":"f5cd43cd8539f650ae036ac96e241d2b"}},"version":"FakeTSVersion","root":[2],"fileNames":["lib.es2026.full.d.ts","../src/input.ts"],"fileInfos":[{"version":"8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true,"impliedNodeFormat":1},{"version":"5b9a42bf66ffbe47e77eda047a1a5cd9-export function value() {\n  return 1;\n}\n","signature":"af02c4eaa2d8d1990523e42fb4f06275-export declare function value(): number;\n","impliedNodeFormat":1}],"options":{"composite":true,"noEmitOnError":true,"outDir":"./"},"latestChangedDtsFile":"./src/input.d.ts"}
//// [/home/src/workspaces/project/dist/tsconfig.tsbuildinfo.readable.baseline.txt] *new* 
{
  "formatting": {
    "options": "3d9ec6d66b0cbcba9a6936012cbf00a2",
    "files": {
      "../src/input.ts": "f5cd43cd8539f650ae036ac96e241d2b"
    }
  },
  "version": "FakeTSVersion",
  "root": [
    {
      "files": [
        "../src/input.ts"
      ],
      "original": 2
    }
  ],
  "fileNames": [
    "lib.es2026.full.d.ts",
    "../src/input.ts"
  ],
  "fileInfos": [
    {
      "fileName": "lib.es2026.full.d.ts",
      "version": "8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };",
      "signature": "8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };",
      "affectsGlobalScope": true,
      "impliedNodeFormat": "CommonJS",
      "original": {
        "version": "8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };",
        "affectsGlobalScope": true,
        "impliedNodeFormat": 1
      }
    },
    {
      "fileName": "../src/input.ts",
      "version": "5b9a42bf66ffbe47e77eda047a1a5cd9-export function value() {\n  return 1;\n}\n",
      "signature": "af02c4eaa2d8d1990523e42fb4f06275-export declare function value(): number;\n",
      "impliedNodeFormat": "CommonJS",
      "original": {
        "version": "5b9a42bf66ffbe47e77eda047a1a5cd9-export function value() {\n  return 1;\n}\n",
        "signature": "af02c4eaa2d8d1990523e42fb4f06275-export declare function value(): number;\n",
        "impliedNodeFormat": 1
      }
    }
  ],
  "options": {
    "composite": true,
    "noEmitOnError": true,
    "outDir": "./"
  },
  "latestChangedDtsFile": "./src/input.d.ts",
  "size": 1309
}

Watch Registrations::
Directory watches::
  /home/src/tslibs/TS/Lib
  /home/src/workspaces/project
  /home/src/workspaces/project/src (recursive)
tsconfig.json::
SemanticDiagnostics::
*refresh*    /home/src/tslibs/TS/Lib/lib.es2026.full.d.ts
*refresh*    /home/src/workspaces/project/src/input.ts
Signatures::
(stored at emit) /home/src/workspaces/project/src/input.ts


Edit [0]:: no change


Output::

Watch Registrations::
Directory watches::
  /home/src/tslibs/TS/Lib
  /home/src/workspaces/project
  /home/src/workspaces/project/src (recursive)


Edit [1]:: change inherited formatting settings
//// [/home/src/workspaces/project/base.json] *modified* 
{"formattingOptions":{"indentSize":4}}


Output::
[2J[3J[H[[90mHH:MM:SS AM[0m] File change detected. Starting incremental compilation...

[[90mHH:MM:SS AM[0m] Found 0 errors. Watching for file changes.

//// [/home/src/workspaces/project/dist/src/input.js] *rewrite with same content*
//// [/home/src/workspaces/project/dist/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"../src/input.ts":"e06d53e042b114b80414e49f47a0346f"}},"version":"FakeTSVersion","root":[2],"fileNames":["lib.es2026.full.d.ts","../src/input.ts"],"fileInfos":[{"version":"8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true,"impliedNodeFormat":1},{"version":"915df474efb89602f3a4330e61e4f21d-export function value() {\n    return 1;\n}\n","signature":"af02c4eaa2d8d1990523e42fb4f06275-export declare function value(): number;\n","impliedNodeFormat":1}],"options":{"composite":true,"noEmitOnError":true,"outDir":"./"},"latestChangedDtsFile":"./src/input.d.ts"}
//// [/home/src/workspaces/project/dist/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "../src/input.ts": "e06d53e042b114b80414e49f47a0346f"
    }
  },
  "version": "FakeTSVersion",
  "root": [
    {
      "files": [
        "../src/input.ts"
      ],
      "original": 2
    }
  ],
  "fileNames": [
    "lib.es2026.full.d.ts",
    "../src/input.ts"
  ],
  "fileInfos": [
    {
      "fileName": "lib.es2026.full.d.ts",
      "version": "8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };",
      "signature": "8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };",
      "affectsGlobalScope": true,
      "impliedNodeFormat": "CommonJS",
      "original": {
        "version": "8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };",
        "affectsGlobalScope": true,
        "impliedNodeFormat": 1
      }
    },
    {
      "fileName": "../src/input.ts",
      "version": "915df474efb89602f3a4330e61e4f21d-export function value() {\n    return 1;\n}\n",
      "signature": "af02c4eaa2d8d1990523e42fb4f06275-export declare function value(): number;\n",
      "impliedNodeFormat": "CommonJS",
      "original": {
        "version": "915df474efb89602f3a4330e61e4f21d-export function value() {\n    return 1;\n}\n",
        "signature": "af02c4eaa2d8d1990523e42fb4f06275-export declare function value(): number;\n",
        "impliedNodeFormat": 1
      }
    }
  ],
  "options": {
    "composite": true,
    "noEmitOnError": true,
    "outDir": "./"
  },
  "latestChangedDtsFile": "./src/input.d.ts",
  "size": 1311
}
//// [/home/src/workspaces/project/src/input.ts] *modified* 
export function value() {
    return 1;
}


Watch Registrations::
Directory watches::
  /home/src/tslibs/TS/Lib
  /home/src/workspaces/project
  /home/src/workspaces/project/src (recursive)
tsconfig.json::
SemanticDiagnostics::
*refresh*    /home/src/workspaces/project/src/input.ts
Signatures::
(computed .d.ts) /home/src/workspaces/project/src/input.ts


Edit [2]:: change source text
//// [/home/src/workspaces/project/src/input.ts] *modified* 
export function value(){
return 2;
}



Output::
[2J[3J[H[[90mHH:MM:SS AM[0m] File change detected. Starting incremental compilation...

[[90mHH:MM:SS AM[0m] Found 0 errors. Watching for file changes.

//// [/home/src/workspaces/project/dist/src/input.js] *modified* 
export function value() {
    return 2;
}

//// [/home/src/workspaces/project/dist/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"../src/input.ts":"6fa02b912e65ede51ceb842f1d9f50dc"}},"version":"FakeTSVersion","root":[2],"fileNames":["lib.es2026.full.d.ts","../src/input.ts"],"fileInfos":[{"version":"8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true,"impliedNodeFormat":1},{"version":"434a61df9184a6a7d31b2d97ca787d7a-export function value() {\n    return 2;\n}\n","signature":"af02c4eaa2d8d1990523e42fb4f06275-export declare function value(): number;\n","impliedNodeFormat":1}],"options":{"composite":true,"noEmitOnError":true,"outDir":"./"},"latestChangedDtsFile":"./src/input.d.ts"}
//// [/home/src/workspaces/project/dist/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "../src/input.ts": "6fa02b912e65ede51ceb842f1d9f50dc"
    }
  },
  "version": "FakeTSVersion",
  "root": [
    {
      "files": [
        "../src/input.ts"
      ],
      "original": 2
    }
  ],
  "fileNames": [
    "lib.es2026.full.d.ts",
    "../src/input.ts"
  ],
  "fileInfos": [
    {
      "fileName": "lib.es2026.full.d.ts",
      "version": "8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };",
      "signature": "8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };",
      "affectsGlobalScope": true,
      "impliedNodeFormat": "CommonJS",
      "original": {
        "version": "8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };",
        "affectsGlobalScope": true,
        "impliedNodeFormat": 1
      }
    },
    {
      "fileName": "../src/input.ts",
      "version": "434a61df9184a6a7d31b2d97ca787d7a-export function value() {\n    return 2;\n}\n",
      "signature": "af02c4eaa2d8d1990523e42fb4f06275-export declare function value(): number;\n",
      "impliedNodeFormat": "CommonJS",
      "original": {
        "version": "434a61df9184a6a7d31b2d97ca787d7a-export function value() {\n    return 2;\n}\n",
        "signature": "af02c4eaa2d8d1990523e42fb4f06275-export declare function value(): number;\n",
        "impliedNodeFormat": 1
      }
    }
  ],
  "options": {
    "composite": true,
    "noEmitOnError": true,
    "outDir": "./"
  },
  "latestChangedDtsFile": "./src/input.d.ts",
  "size": 1311
}
//// [/home/src/workspaces/project/src/input.ts] *modified* 
export function value() {
    return 2;
}


Watch Registrations::
Directory watches::
  /home/src/tslibs/TS/Lib
  /home/src/workspaces/project
  /home/src/workspaces/project/src (recursive)
tsconfig.json::
SemanticDiagnostics::
*refresh*    /home/src/workspaces/project/src/input.ts
Signatures::
(computed .d.ts) /home/src/workspaces/project/src/input.ts


Edit [3]:: add an unformatted input
//// [/home/src/workspaces/project/src/added.ts] *new* 
export const added=1;



Output::
[2J[3J[H[[90mHH:MM:SS AM[0m] File change detected. Starting incremental compilation...

[[90mHH:MM:SS AM[0m] Found 0 errors. Watching for file changes.

//// [/home/src/workspaces/project/dist/src/added.d.ts] *new* 
export declare const added = 1;

//// [/home/src/workspaces/project/dist/src/added.js] *new* 
export const added = 1;

//// [/home/src/workspaces/project/dist/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"../src/input.ts":"6fa02b912e65ede51ceb842f1d9f50dc","../src/added.ts":"5470b68f545d7968d1b10a2aeab0e443"}},"version":"FakeTSVersion","root":[[2,3]],"fileNames":["lib.es2026.full.d.ts","../src/added.ts","../src/input.ts"],"fileInfos":[{"version":"8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true,"impliedNodeFormat":1},{"version":"5fc24904143a292bfe1f5ae41d8ef7fb-export const added = 1;\n","signature":"46dd870c2a50187f4e57de30251b5cdf-export declare const added = 1;\n","impliedNodeFormat":1},{"version":"434a61df9184a6a7d31b2d97ca787d7a-export function value() {\n    return 2;\n}\n","signature":"af02c4eaa2d8d1990523e42fb4f06275-export declare function value(): number;\n","impliedNodeFormat":1}],"options":{"composite":true,"noEmitOnError":true,"outDir":"./"},"latestChangedDtsFile":"./src/added.d.ts"}
//// [/home/src/workspaces/project/dist/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "../src/input.ts": "6fa02b912e65ede51ceb842f1d9f50dc",
      "../src/added.ts": "5470b68f545d7968d1b10a2aeab0e443"
    }
  },
  "version": "FakeTSVersion",
  "root": [
    {
      "files": [
        "../src/added.ts",
        "../src/input.ts"
      ],
      "original": [
        2,
        3
      ]
    }
  ],
  "fileNames": [
    "lib.es2026.full.d.ts",
    "../src/added.ts",
    "../src/input.ts"
  ],
  "fileInfos": [
    {
      "fileName": "lib.es2026.full.d.ts",
      "version": "8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };",
      "signature": "8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };",
      "affectsGlobalScope": true,
      "impliedNodeFormat": "CommonJS",
      "original": {
        "version": "8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };",
        "affectsGlobalScope": true,
        "impliedNodeFormat": 1
      }
    },
    {
      "fileName": "../src/added.ts",
      "version": "5fc24904143a292bfe1f5ae41d8ef7fb-export const added = 1;\n",
      "signature": "46dd870c2a50187f4e57de30251b5cdf-export declare const added = 1;\n",
      "impliedNodeFormat": "CommonJS",
      "original": {
        "version": "5fc24904143a292bfe1f5ae41d8ef7fb-export const added = 1;\n",
        "signature": "46dd870c2a50187f4e57de30251b5cdf-export declare const added = 1;\n",
        "impliedNodeFormat": 1
      }
    },
    {
      "fileName": "../src/input.ts",
      "version": "434a61df9184a6a7d31b2d97ca787d7a-export function value() {\n    return 2;\n}\n",
      "signature": "af02c4eaa2d8d1990523e42fb4f06275-export declare function value(): number;\n",
      "impliedNodeFormat": "CommonJS",
      "original": {
        "version": "434a61df9184a6a7d31b2d97ca787d7a-export function value() {\n    return 2;\n}\n",
        "signature": "af02c4eaa2d8d1990523e42fb4f06275-export declare function value(): number;\n",
        "impliedNodeFormat": 1
      }
    }
  ],
  "options": {
    "composite": true,
    "noEmitOnError": true,
    "outDir": "./"
  },
  "latestChangedDtsFile": "./src/added.d.ts",
  "size": 1562
}
//// [/home/src/workspaces/project/src/added.ts] *modified* 
export const added = 1;


Watch Registrations::
Directory watches::
  /home/src/tslibs/TS/Lib
  /home/src/workspaces/project
  /home/src/workspaces/project/src (recursive)
tsconfig.json::
SemanticDiagnostics::
*refresh*    /home/src/workspaces/project/src/added.ts
Signatures::
(computed .d.ts) /home/src/workspaces/project/src/added.ts


Edit [4]:: remove an input
//// [/home/src/workspaces/project/src/added.ts] *deleted*


Output::
[2J[3J[H[[90mHH:MM:SS AM[0m] File change detected. Starting incremental compilation...

[[90mHH:MM:SS AM[0m] Found 0 errors. Watching for file changes.

//// [/home/src/workspaces/project/dist/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"../src/input.ts":"6fa02b912e65ede51ceb842f1d9f50dc","../src/added.ts":"5470b68f545d7968d1b10a2aeab0e443"}},"version":"FakeTSVersion","root":[2],"fileNames":["lib.es2026.full.d.ts","../src/input.ts"],"fileInfos":[{"version":"8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true,"impliedNodeFormat":1},{"version":"434a61df9184a6a7d31b2d97ca787d7a-export function value() {\n    return 2;\n}\n","signature":"af02c4eaa2d8d1990523e42fb4f06275-export declare function value(): number;\n","impliedNodeFormat":1}],"options":{"composite":true,"noEmitOnError":true,"outDir":"./"},"latestChangedDtsFile":"./src/added.d.ts"}
//// [/home/src/workspaces/project/dist/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "../src/input.ts": "6fa02b912e65ede51ceb842f1d9f50dc",
      "../src/added.ts": "5470b68f545d7968d1b10a2aeab0e443"
    }
  },
  "version": "FakeTSVersion",
  "root": [
    {
      "files": [
        "../src/input.ts"
      ],
      "original": 2
    }
  ],
  "fileNames": [
    "lib.es2026.full.d.ts",
    "../src/input.ts"
  ],
  "fileInfos": [
    {
      "fileName": "lib.es2026.full.d.ts",
      "version": "8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };",
      "signature": "8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };",
      "affectsGlobalScope": true,
      "impliedNodeFormat": "CommonJS",
      "original": {
        "version": "8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };",
        "affectsGlobalScope": true,
        "impliedNodeFormat": 1
      }
    },
    {
      "fileName": "../src/input.ts",
      "version": "434a61df9184a6a7d31b2d97ca787d7a-export function value() {\n    return 2;\n}\n",
      "signature": "af02c4eaa2d8d1990523e42fb4f06275-export declare function value(): number;\n",
      "impliedNodeFormat": "CommonJS",
      "original": {
        "version": "434a61df9184a6a7d31b2d97ca787d7a-export function value() {\n    return 2;\n}\n",
        "signature": "af02c4eaa2d8d1990523e42fb4f06275-export declare function value(): number;\n",
        "impliedNodeFormat": 1
      }
    }
  ],
  "options": {
    "composite": true,
    "noEmitOnError": true,
    "outDir": "./"
  },
  "latestChangedDtsFile": "./src/added.d.ts",
  "size": 1364
}

Watch Registrations::
Directory watches::
  /home/src/tslibs/TS/Lib
  /home/src/workspaces/project
  /home/src/workspaces/project/src (recursive)
tsconfig.json::
SemanticDiagnostics::
Signatures::


Edit [5]:: introduce a semantic error
//// [/home/src/workspaces/project/src/input.ts] *modified* 
export const value:string=1;



Output::
[2J[3J[H[[90mHH:MM:SS AM[0m] File change detected. Starting incremental compilation...

[96msrc/input.ts[0m:[93m1[0m:[93m14[0m - [91merror[0m[90m TS2322: [0mType 'number' is not assignable to type 'string'.

[7m1[0m export const value: string = 1;
[7m [0m [91m             ~~~~~[0m

[[90mHH:MM:SS AM[0m] Found 1 error. Watching for file changes.

//// [/home/src/workspaces/project/dist/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"../src/input.ts":"6eb0b12d7522234e7fc6deec3b3e86de","../src/added.ts":"5470b68f545d7968d1b10a2aeab0e443"}},"version":"FakeTSVersion","root":[2],"fileNames":["lib.es2026.full.d.ts","../src/input.ts"],"fileInfos":[{"version":"8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true,"impliedNodeFormat":1},{"version":"4a33b7b31b7e74ced16fb3f123ab51c8-export const value: string = 1;\n","signature":"d704bb9feb766d5360f4081857e4c09e-export declare const value: string;\n","impliedNodeFormat":1}],"options":{"composite":true,"noEmitOnError":true,"outDir":"./"},"semanticDiagnosticsPerFile":[[2,[{"pos":13,"end":18,"code":2322,"category":1,"messageKey":"Type_0_is_not_assignable_to_type_1_2322","messageArgs":["number","string"]}]]],"affectedFilesPendingEmit":[2],"latestChangedDtsFile":"./src/added.d.ts","emitSignatures":[[2,"af02c4eaa2d8d1990523e42fb4f06275-export declare function value(): number;\n"]]}
//// [/home/src/workspaces/project/dist/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "../src/input.ts": "6eb0b12d7522234e7fc6deec3b3e86de",
      "../src/added.ts": "5470b68f545d7968d1b10a2aeab0e443"
    }
  },
  "version": "FakeTSVersion",
  "root": [
    {
      "files": [
        "../src/input.ts"
      ],
      "original": 2
    }
  ],
  "fileNames": [
    "lib.es2026.full.d.ts",
    "../src/input.ts"
  ],
  "fileInfos": [
    {
      "fileName": "lib.es2026.full.d.ts",
      "version": "8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };",
      "signature": "8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };",
      "affectsGlobalScope": true,
      "impliedNodeFormat": "CommonJS",
      "original": {
        "version": "8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };",
        "affectsGlobalScope": true,
        "impliedNodeFormat": 1
      }
    },
    {
      "fileName": "../src/input.ts",
      "version": "4a33b7b31b7e74ced16fb3f123ab51c8-export const value: string = 1;\n",
      "signature": "d704bb9feb766d5360f4081857e4c09e-export declare const value: string;\n",
      "impliedNodeFormat": "CommonJS",
      "original": {
        "version": "4a33b7b31b7e74ced16fb3f123ab51c8-export const value: string = 1;\n",
        "signature": "d704bb9feb766d5360f4081857e4c09e-export declare const value: string;\n",
        "impliedNodeFormat": 1
      }
    }
  ],
  "options": {
    "composite": true,
    "noEmitOnError": true,
    "outDir": "./"
  },
  "semanticDiagnosticsPerFile": [
    [
      "../src/input.ts",
      [
        {
          "pos": 13,
          "end": 18,
          "code": 2322,
          "category": 1,
          "messageKey": "Type_0_is_not_assignable_to_type_1_2322",
          "messageArgs": [
            "number",
            "string"
          ]
        }
      ]
    ]
  ],
  "affectedFilesPendingEmit": [
    [
      "../src/input.ts",
      "Js|Dts",
      2
    ]
  ],
  "latestChangedDtsFile": "./src/added.d.ts",
  "emitSignatures": [
    {
      "file": "../src/input.ts",
      "signature": "af02c4eaa2d8d1990523e42fb4f06275-export declare function value(): number;\n",
      "original": [
        2,
        "af02c4eaa2d8d1990523e42fb4f06275-export declare function value(): number;\n"
      ]
    }
  ],
  "size": 1650
}
//// [/home/src/workspaces/project/src/input.ts] *modified* 
export const value: string = 1;


Watch Registrations::
Directory watches::
  /home/src/tslibs/TS/Lib
  /home/src/workspaces/project
  /home/src/workspaces/project/src (recursive)
tsconfig.json::
SemanticDiagnostics::
*refresh*    /home/src/workspaces/project/src/input.ts
Signatures::
(computed .d.ts) /home/src/workspaces/project/src/input.ts


Edit [6]:: fix the semantic error
//// [/home/src/workspaces/project/src/input.ts] *modified* 
export const value=3;



Output::
[2J[3J[H[[90mHH:MM:SS AM[0m] File change detected. Starting incremental compilation...

[[90mHH:MM:SS AM[0m] Found 0 errors. Watching for file changes.

//// [/home/src/workspaces/project/dist/src/input.d.ts] *modified* 
export declare const value = 3;

//// [/home/src/workspaces/project/dist/src/input.js] *modified* 
export const value = 3;

//// [/home/src/workspaces/project/dist/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"../src/input.ts":"bb51e8c1877be486b8cee83b2eadeae5","../src/added.ts":"5470b68f545d7968d1b10a2aeab0e443"}},"version":"FakeTSVersion","root":[2],"fileNames":["lib.es2026.full.d.ts","../src/input.ts"],"fileInfos":[{"version":"8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true,"impliedNodeFormat":1},{"version":"aaedf8aa1abd76297e3c4f9d1dc724e0-export const value = 3;\n","signature":"984c5f21fe6d90e913fe9545ba992fbe-export declare const value = 3;\n","impliedNodeFormat":1}],"options":{"composite":true,"noEmitOnError":true,"outDir":"./"},"latestChangedDtsFile":"./src/input.d.ts"}
//// [/home/src/workspaces/project/dist/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "../src/input.ts": "bb51e8c1877be486b8cee83b2eadeae5",
      "../src/added.ts": "5470b68f545d7968d1b10a2aeab0e443"
    }
  },
  "version": "FakeTSVersion",
  "root": [
    {
      "files": [
        "../src/input.ts"
      ],
      "original": 2
    }
  ],
  "fileNames": [
    "lib.es2026.full.d.ts",
    "../src/input.ts"
  ],
  "fileInfos": [
    {
      "fileName": "lib.es2026.full.d.ts",
      "version": "8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };",
      "signature": "8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };",
      "affectsGlobalScope": true,
      "impliedNodeFormat": "CommonJS",
      "original": {
        "version": "8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };",
        "affectsGlobalScope": true,
        "impliedNodeFormat": 1
      }
    },
    {
      "fileName": "../src/input.ts",
      "version": "aaedf8aa1abd76297e3c4f9d1dc724e0-export const value = 3;\n",
      "signature": "984c5f21fe6d90e913fe9545ba992fbe-export declare const value = 3;\n",
      "impliedNodeFormat": "CommonJS",
      "original": {
        "version": "aaedf8aa1abd76297e3c4f9d1dc724e0-export const value = 3;\n",
        "signature": "984c5f21fe6d90e913fe9545ba992fbe-export declare const value = 3;\n",
        "impliedNodeFormat": 1
      }
    }
  ],
  "options": {
    "composite": true,
    "noEmitOnError": true,
    "outDir": "./"
  },
  "latestChangedDtsFile": "./src/input.d.ts",
  "size": 1335
}
//// [/home/src/workspaces/project/src/input.ts] *modified* 
export const value = 3;


Watch Registrations::
Directory watches::
  /home/src/tslibs/TS/Lib
  /home/src/workspaces/project
  /home/src/workspaces/project/src (recursive)
tsconfig.json::
SemanticDiagnostics::
*refresh*    /home/src/workspaces/project/src/input.ts
Signatures::
(computed .d.ts) /home/src/workspaces/project/src/input.ts


Edit [7]:: no change


Output::

Watch Registrations::
Directory watches::
  /home/src/tslibs/TS/Lib
  /home/src/workspaces/project
  /home/src/workspaces/project/src (recursive)
