currentDirectory::/home/src/workspaces/project
useCaseSensitiveFileNames::true
Input::
//// [/home/src/workspaces/project/base.json] *new* 
{"formattingOptions":{"indentSize":2}}
//// [/home/src/workspaces/project/input.ts] *new* 
export function value() {
  return 1;
}

//// [/home/src/workspaces/project/tsconfig.json] *new* 
{"extends":"./base.json","compilerOptions":{"incremental":true,"composite":true,"declaration":true,"sourceMap":true,"declarationMap":true},"files":["input.ts"]}

tsgo -b . --format
ExitStatus:: Success
Output::
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
//// [/home/src/workspaces/project/input.d.ts] *new* 
export declare function value(): number;
//# sourceMappingURL=input.d.ts.map
//// [/home/src/workspaces/project/input.d.ts.map] *new* 
{"version":3,"file":"input.d.ts","sources":["input.ts"],"names":[],"mappings":"AAAA,wBAAgB,KAAK,WAEpB"}
//// [/home/src/workspaces/project/input.js] *new* 
export function value() {
    return 1;
}
//# sourceMappingURL=input.js.map
//// [/home/src/workspaces/project/input.js.map] *new* 
{"version":3,"file":"input.js","sources":["input.ts"],"names":[],"mappings":"AAAA,MAAM,UAAU,KAAK;IACnB,OAAO,CAAC,CAAC;AACX,CAAC"}
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo] *new* 
{"formatting":{"options":"3d9ec6d66b0cbcba9a6936012cbf00a2","files":{"input.ts":"5752e44b8e3c3975b4259e940cc33773"}},"version":"FakeTSVersion","root":[2],"fileNames":["lib.es2026.full.d.ts","./input.ts"],"fileInfos":[{"version":"8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true,"impliedNodeFormat":1},{"version":"5b9a42bf66ffbe47e77eda047a1a5cd9-export function value() {\n  return 1;\n}\n","signature":"af02c4eaa2d8d1990523e42fb4f06275-export declare function value(): number;\n","impliedNodeFormat":1}],"options":{"composite":true,"declaration":true,"declarationMap":true,"sourceMap":true},"latestChangedDtsFile":"./input.d.ts"}
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo.readable.baseline.txt] *new* 
{
  "formatting": {
    "options": "3d9ec6d66b0cbcba9a6936012cbf00a2",
    "files": {
      "input.ts": "5752e44b8e3c3975b4259e940cc33773"
    }
  },
  "version": "FakeTSVersion",
  "root": [
    {
      "files": [
        "./input.ts"
      ],
      "original": 2
    }
  ],
  "fileNames": [
    "lib.es2026.full.d.ts",
    "./input.ts"
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
      "fileName": "./input.ts",
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
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "latestChangedDtsFile": "./input.d.ts",
  "size": 1316
}

tsconfig.json::
SemanticDiagnostics::
*refresh*    /home/src/tslibs/TS/Lib/lib.es2026.full.d.ts
*refresh*    /home/src/workspaces/project/input.ts
Signatures::
(stored at emit) /home/src/workspaces/project/input.ts


Edit [0]:: no change

tsgo -b . --format
ExitStatus:: Success
Output::



Edit [1]:: invalidate cached formatting through inherited settings
//// [/home/src/workspaces/project/base.json] *modified* 
{"formattingOptions":{"indentSize":4}}

tsgo -b . --format
ExitStatus:: Success
Output::
//// [/home/src/workspaces/project/input.d.ts.map] *rewrite with same content*
//// [/home/src/workspaces/project/input.js] *rewrite with same content*
//// [/home/src/workspaces/project/input.js.map] *modified* 
{"version":3,"file":"input.js","sources":["input.ts"],"names":[],"mappings":"AAAA,MAAM,UAAU,KAAK;IACjB,OAAO,CAAC,CAAC;AACb,CAAC"}
//// [/home/src/workspaces/project/input.ts] *modified* 
export function value() {
    return 1;
}

//// [/home/src/workspaces/project/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"input.ts":"75dd3e95094b0f0849ac0eff488f4fcc"}},"version":"FakeTSVersion","root":[2],"fileNames":["lib.es2026.full.d.ts","./input.ts"],"fileInfos":[{"version":"8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true,"impliedNodeFormat":1},{"version":"915df474efb89602f3a4330e61e4f21d-export function value() {\n    return 1;\n}\n","signature":"af02c4eaa2d8d1990523e42fb4f06275-export declare function value(): number;\n","impliedNodeFormat":1}],"options":{"composite":true,"declaration":true,"declarationMap":true,"sourceMap":true},"latestChangedDtsFile":"./input.d.ts"}
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "input.ts": "75dd3e95094b0f0849ac0eff488f4fcc"
    }
  },
  "version": "FakeTSVersion",
  "root": [
    {
      "files": [
        "./input.ts"
      ],
      "original": 2
    }
  ],
  "fileNames": [
    "lib.es2026.full.d.ts",
    "./input.ts"
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
      "fileName": "./input.ts",
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
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "latestChangedDtsFile": "./input.d.ts",
  "size": 1318
}

tsconfig.json::
SemanticDiagnostics::
*refresh*    /home/src/workspaces/project/input.ts
Signatures::
(computed .d.ts) /home/src/workspaces/project/input.ts


Edit [2]:: no change

tsgo -b . --format
ExitStatus:: Success
Output::



Edit [3]:: recover from malformed build info
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo] *modified* 
{invalid

tsgo -b . --format
ExitStatus:: Success
Output::
//// [/home/src/workspaces/project/input.d.ts] *rewrite with same content*
//// [/home/src/workspaces/project/input.d.ts.map] *rewrite with same content*
//// [/home/src/workspaces/project/input.js] *rewrite with same content*
//// [/home/src/workspaces/project/input.js.map] *rewrite with same content*
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"input.ts":"75dd3e95094b0f0849ac0eff488f4fcc"}},"version":"FakeTSVersion","root":[2],"fileNames":["lib.es2026.full.d.ts","./input.ts"],"fileInfos":[{"version":"8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true,"impliedNodeFormat":1},{"version":"915df474efb89602f3a4330e61e4f21d-export function value() {\n    return 1;\n}\n","signature":"af02c4eaa2d8d1990523e42fb4f06275-export declare function value(): number;\n","impliedNodeFormat":1}],"options":{"composite":true,"declaration":true,"declarationMap":true,"sourceMap":true},"latestChangedDtsFile":"./input.d.ts"}
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo.readable.baseline.txt] *rewrite with same content*

tsconfig.json::
SemanticDiagnostics::
*refresh*    /home/src/tslibs/TS/Lib/lib.es2026.full.d.ts
*refresh*    /home/src/workspaces/project/input.ts
Signatures::
(stored at emit) /home/src/workspaces/project/input.ts


Edit [4]:: recover from build info from another compiler version
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo] *modified* 
{"version":"OldVersion","formatting":{"options":"old","files":{}}}

tsgo -b . --format
ExitStatus:: Success
Output::
//// [/home/src/workspaces/project/input.d.ts] *rewrite with same content*
//// [/home/src/workspaces/project/input.d.ts.map] *rewrite with same content*
//// [/home/src/workspaces/project/input.js] *rewrite with same content*
//// [/home/src/workspaces/project/input.js.map] *rewrite with same content*
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"input.ts":"75dd3e95094b0f0849ac0eff488f4fcc"}},"version":"FakeTSVersion","root":[2],"fileNames":["lib.es2026.full.d.ts","./input.ts"],"fileInfos":[{"version":"8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true,"impliedNodeFormat":1},{"version":"915df474efb89602f3a4330e61e4f21d-export function value() {\n    return 1;\n}\n","signature":"af02c4eaa2d8d1990523e42fb4f06275-export declare function value(): number;\n","impliedNodeFormat":1}],"options":{"composite":true,"declaration":true,"declarationMap":true,"sourceMap":true},"latestChangedDtsFile":"./input.d.ts"}
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo.readable.baseline.txt] *rewrite with same content*

tsconfig.json::
SemanticDiagnostics::
*refresh*    /home/src/tslibs/TS/Lib/lib.es2026.full.d.ts
*refresh*    /home/src/workspaces/project/input.ts
Signatures::
(stored at emit) /home/src/workspaces/project/input.ts


Edit [5]:: invalidate cached formatting through source changes
//// [/home/src/workspaces/project/input.ts] *modified* 
export function value(){
return 2;
}


tsgo -b . --format
ExitStatus:: Success
Output::
//// [/home/src/workspaces/project/input.d.ts.map] *rewrite with same content*
//// [/home/src/workspaces/project/input.js] *modified* 
export function value() {
    return 2;
}
//# sourceMappingURL=input.js.map
//// [/home/src/workspaces/project/input.js.map] *rewrite with same content*
//// [/home/src/workspaces/project/input.ts] *modified* 
export function value() {
    return 2;
}

//// [/home/src/workspaces/project/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"input.ts":"3abee701a99f7c3a886ffd9deeccd8cf"}},"version":"FakeTSVersion","root":[2],"fileNames":["lib.es2026.full.d.ts","./input.ts"],"fileInfos":[{"version":"8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true,"impliedNodeFormat":1},{"version":"434a61df9184a6a7d31b2d97ca787d7a-export function value() {\n    return 2;\n}\n","signature":"af02c4eaa2d8d1990523e42fb4f06275-export declare function value(): number;\n","impliedNodeFormat":1}],"options":{"composite":true,"declaration":true,"declarationMap":true,"sourceMap":true},"latestChangedDtsFile":"./input.d.ts"}
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "input.ts": "3abee701a99f7c3a886ffd9deeccd8cf"
    }
  },
  "version": "FakeTSVersion",
  "root": [
    {
      "files": [
        "./input.ts"
      ],
      "original": 2
    }
  ],
  "fileNames": [
    "lib.es2026.full.d.ts",
    "./input.ts"
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
      "fileName": "./input.ts",
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
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "latestChangedDtsFile": "./input.d.ts",
  "size": 1318
}

tsconfig.json::
SemanticDiagnostics::
*refresh*    /home/src/workspaces/project/input.ts
Signatures::
(computed .d.ts) /home/src/workspaces/project/input.ts


Edit [6]:: no change

tsgo -b . --format
ExitStatus:: Success
Output::



Edit [7]:: check without emitting after formatting

tsgo -b . --noEmit
ExitStatus:: Success
Output::



Edit [8]:: compile without formatting

tsgo -b .
ExitStatus:: Success
Output::



Diff:: Source maps refer to the input formatted by earlier runs; the fresh build compiles the original unformatted input.
--- nonIncremental /home/src/workspaces/project/input.js.map
+++ incremental /home/src/workspaces/project/input.js.map
@@ -1,1 +1,1 @@
-{"version":3,"file":"input.js","sources":["input.ts"],"names":[],"mappings":"AAAA,MAAM,UAAU,KAAK;IACrB,OAAO,CAAC,CAAC;AACT,CAAC"}
+{"version":3,"file":"input.js","sources":["input.ts"],"names":[],"mappings":"AAAA,MAAM,UAAU,KAAK;IACjB,OAAO,CAAC,CAAC;AACb,CAAC"}


Edit [9]:: compile changed source without formatting
//// [/home/src/workspaces/project/input.ts] *modified* 
export function value(){
return 3;
}


tsgo -b .
ExitStatus:: Success
Output::
//// [/home/src/workspaces/project/input.d.ts.map] *rewrite with same content*
//// [/home/src/workspaces/project/input.js] *modified* 
export function value() {
    return 3;
}
//# sourceMappingURL=input.js.map
//// [/home/src/workspaces/project/input.js.map] *modified* 
{"version":3,"file":"input.js","sources":["input.ts"],"names":[],"mappings":"AAAA,MAAM,UAAU,KAAK;IACrB,OAAO,CAAC,CAAC;AACT,CAAC"}
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"input.ts":"3abee701a99f7c3a886ffd9deeccd8cf"}},"version":"FakeTSVersion","root":[2],"fileNames":["lib.es2026.full.d.ts","./input.ts"],"fileInfos":[{"version":"8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true,"impliedNodeFormat":1},{"version":"25f31bdd0281aac5964c205d245872ce-export function value(){\nreturn 3;\n}\n","signature":"af02c4eaa2d8d1990523e42fb4f06275-export declare function value(): number;\n","impliedNodeFormat":1}],"options":{"composite":true,"declaration":true,"declarationMap":true,"sourceMap":true},"latestChangedDtsFile":"./input.d.ts"}
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "input.ts": "3abee701a99f7c3a886ffd9deeccd8cf"
    }
  },
  "version": "FakeTSVersion",
  "root": [
    {
      "files": [
        "./input.ts"
      ],
      "original": 2
    }
  ],
  "fileNames": [
    "lib.es2026.full.d.ts",
    "./input.ts"
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
      "fileName": "./input.ts",
      "version": "25f31bdd0281aac5964c205d245872ce-export function value(){\nreturn 3;\n}\n",
      "signature": "af02c4eaa2d8d1990523e42fb4f06275-export declare function value(): number;\n",
      "impliedNodeFormat": "CommonJS",
      "original": {
        "version": "25f31bdd0281aac5964c205d245872ce-export function value(){\nreturn 3;\n}\n",
        "signature": "af02c4eaa2d8d1990523e42fb4f06275-export declare function value(): number;\n",
        "impliedNodeFormat": 1
      }
    }
  ],
  "options": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "latestChangedDtsFile": "./input.d.ts",
  "size": 1313
}

tsconfig.json::
SemanticDiagnostics::
*refresh*    /home/src/workspaces/project/input.ts
Signatures::
(computed .d.ts) /home/src/workspaces/project/input.ts


Edit [10]:: resume formatting after ordinary compilation

tsgo -b . --format
ExitStatus:: Success
Output::
//// [/home/src/workspaces/project/input.d.ts.map] *rewrite with same content*
//// [/home/src/workspaces/project/input.js] *rewrite with same content*
//// [/home/src/workspaces/project/input.js.map] *modified* 
{"version":3,"file":"input.js","sources":["input.ts"],"names":[],"mappings":"AAAA,MAAM,UAAU,KAAK;IACjB,OAAO,CAAC,CAAC;AACb,CAAC"}
//// [/home/src/workspaces/project/input.ts] *modified* 
export function value() {
    return 3;
}

//// [/home/src/workspaces/project/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"input.ts":"e27f6eb77bc930a56f2f598d1ea33391"}},"version":"FakeTSVersion","root":[2],"fileNames":["lib.es2026.full.d.ts","./input.ts"],"fileInfos":[{"version":"8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true,"impliedNodeFormat":1},{"version":"823b5c3bb752e3d2ef043e672ccad8b1-export function value() {\n    return 3;\n}\n","signature":"af02c4eaa2d8d1990523e42fb4f06275-export declare function value(): number;\n","impliedNodeFormat":1}],"options":{"composite":true,"declaration":true,"declarationMap":true,"sourceMap":true},"latestChangedDtsFile":"./input.d.ts"}
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "input.ts": "e27f6eb77bc930a56f2f598d1ea33391"
    }
  },
  "version": "FakeTSVersion",
  "root": [
    {
      "files": [
        "./input.ts"
      ],
      "original": 2
    }
  ],
  "fileNames": [
    "lib.es2026.full.d.ts",
    "./input.ts"
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
      "fileName": "./input.ts",
      "version": "823b5c3bb752e3d2ef043e672ccad8b1-export function value() {\n    return 3;\n}\n",
      "signature": "af02c4eaa2d8d1990523e42fb4f06275-export declare function value(): number;\n",
      "impliedNodeFormat": "CommonJS",
      "original": {
        "version": "823b5c3bb752e3d2ef043e672ccad8b1-export function value() {\n    return 3;\n}\n",
        "signature": "af02c4eaa2d8d1990523e42fb4f06275-export declare function value(): number;\n",
        "impliedNodeFormat": 1
      }
    }
  ],
  "options": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "latestChangedDtsFile": "./input.d.ts",
  "size": 1318
}

tsconfig.json::
SemanticDiagnostics::
*refresh*    /home/src/workspaces/project/input.ts
Signatures::
(computed .d.ts) /home/src/workspaces/project/input.ts


Edit [11]:: no change

tsgo -b . --format
ExitStatus:: Success
Output::

