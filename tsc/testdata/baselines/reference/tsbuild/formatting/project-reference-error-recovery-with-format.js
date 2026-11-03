currentDirectory::/home/src/workspaces/project
useCaseSensitiveFileNames::true
Input::
//// [/home/src/workspaces/project/app/index.ts] *new* 
import {value} from '../lib';
export const result=value;

//// [/home/src/workspaces/project/app/tsconfig.json] *new* 
{"compilerOptions":{"composite":true,"noEmitOnError":true},"references":[{"path":"../lib"}],"files":["index.ts"]}
//// [/home/src/workspaces/project/lib/index.ts] *new* 
export const value:string=1;

//// [/home/src/workspaces/project/lib/tsconfig.json] *new* 
{"compilerOptions":{"composite":true,"noEmitOnError":true},"files":["index.ts"]}
//// [/home/src/workspaces/project/tsconfig.json] *new* 
{"files":[],"references":[{"path":"./app"}]}

tsgo -b . --stopBuildOnErrors --format
ExitStatus:: DiagnosticsPresent_OutputsSkipped
Output::
[96mlib/index.ts[0m:[93m1[0m:[93m14[0m - [91merror[0m[90m TS2322: [0mType 'number' is not assignable to type 'string'.

[7m1[0m export const value: string = 1;
[7m [0m [91m             ~~~~~[0m


Found 1 error in lib/index.ts[90m:1[0m

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
//// [/home/src/workspaces/project/app/index.ts] *modified* 
import { value } from '../lib';
export const result = value;

//// [/home/src/workspaces/project/app/tsconfig.tsbuildinfo] *new* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"index.ts":"4b06a2f43fe39800d76334aa684bad31"},"compilationPending":true},"version":"FakeTSVersion"}
//// [/home/src/workspaces/project/app/tsconfig.tsbuildinfo.readable.baseline.txt] *new* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "index.ts": "4b06a2f43fe39800d76334aa684bad31"
    },
    "compilationPending": true
  },
  "version": "FakeTSVersion",
  "size": 169
}
//// [/home/src/workspaces/project/lib/index.ts] *modified* 
export const value: string = 1;

//// [/home/src/workspaces/project/lib/tsconfig.tsbuildinfo] *new* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"index.ts":"7f3800615f44852c2db32f96a6a466d1"}},"version":"FakeTSVersion","root":[2],"fileNames":["lib.es2026.full.d.ts","./index.ts"],"fileInfos":[{"version":"8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true,"impliedNodeFormat":1},"4a33b7b31b7e74ced16fb3f123ab51c8-export const value: string = 1;\n"],"options":{"composite":true,"noEmitOnError":true},"semanticDiagnosticsPerFile":[[2,[{"pos":13,"end":18,"code":2322,"category":1,"messageKey":"Type_0_is_not_assignable_to_type_1_2322","messageArgs":["number","string"]}]]],"affectedFilesPendingEmit":[2],"emitSignatures":[2]}
//// [/home/src/workspaces/project/lib/tsconfig.tsbuildinfo.readable.baseline.txt] *new* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "index.ts": "7f3800615f44852c2db32f96a6a466d1"
    }
  },
  "version": "FakeTSVersion",
  "root": [
    {
      "files": [
        "./index.ts"
      ],
      "original": 2
    }
  ],
  "fileNames": [
    "lib.es2026.full.d.ts",
    "./index.ts"
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
      "fileName": "./index.ts",
      "version": "4a33b7b31b7e74ced16fb3f123ab51c8-export const value: string = 1;\n",
      "signature": "4a33b7b31b7e74ced16fb3f123ab51c8-export const value: string = 1;\n",
      "impliedNodeFormat": "CommonJS"
    }
  ],
  "options": {
    "composite": true,
    "noEmitOnError": true
  },
  "semanticDiagnosticsPerFile": [
    [
      "./index.ts",
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
      "./index.ts",
      "Js|Dts",
      2
    ]
  ],
  "emitSignatures": [
    {
      "file": "./index.ts",
      "original": 2
    }
  ],
  "size": 1330
}

lib/tsconfig.json::
SemanticDiagnostics::
*refresh*    /home/src/tslibs/TS/Lib/lib.es2026.full.d.ts
*refresh*    /home/src/workspaces/project/lib/index.ts
Signatures::


Edit [0]:: no change

tsgo -b . --stopBuildOnErrors --format
ExitStatus:: DiagnosticsPresent_OutputsSkipped
Output::
[96mlib/index.ts[0m:[93m1[0m:[93m14[0m - [91merror[0m[90m TS2322: [0mType 'number' is not assignable to type 'string'.

[7m1[0m export const value: string = 1;
[7m [0m [91m             ~~~~~[0m


Found 1 error in lib/index.ts[90m:1[0m


lib/tsconfig.json::
SemanticDiagnostics::
Signatures::


Edit [1]:: fix upstream semantic error
//// [/home/src/workspaces/project/lib/index.ts] *modified* 
export const value:string='fixed';


tsgo -b . --stopBuildOnErrors --format
ExitStatus:: Success
Output::
//// [/home/src/workspaces/project/app/index.d.ts] *new* 
export declare const result: string;

//// [/home/src/workspaces/project/app/index.js] *new* 
import { value } from '../lib';
export const result = value;

//// [/home/src/workspaces/project/app/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"index.ts":"4b06a2f43fe39800d76334aa684bad31"}},"version":"FakeTSVersion","root":[3],"fileNames":["lib.es2026.full.d.ts","../lib/index.d.ts","./index.ts"],"fileInfos":[{"version":"8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true,"impliedNodeFormat":1},"d704bb9feb766d5360f4081857e4c09e-export declare const value: string;\n",{"version":"f38c57fa379b48b27f0acb5bcd751a4e-import { value } from '../lib';\nexport const result = value;\n","signature":"9b81b256f3e78b27cca4c1cbf76e31fd-export declare const result: string;\n","impliedNodeFormat":1}],"fileIdsList":[[2]],"options":{"composite":true,"noEmitOnError":true},"referencedMap":[[3,1]],"latestChangedDtsFile":"./index.d.ts"}
//// [/home/src/workspaces/project/app/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "index.ts": "4b06a2f43fe39800d76334aa684bad31"
    }
  },
  "version": "FakeTSVersion",
  "root": [
    {
      "files": [
        "./index.ts"
      ],
      "original": 3
    }
  ],
  "fileNames": [
    "lib.es2026.full.d.ts",
    "../lib/index.d.ts",
    "./index.ts"
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
      "fileName": "../lib/index.d.ts",
      "version": "d704bb9feb766d5360f4081857e4c09e-export declare const value: string;\n",
      "signature": "d704bb9feb766d5360f4081857e4c09e-export declare const value: string;\n",
      "impliedNodeFormat": "CommonJS"
    },
    {
      "fileName": "./index.ts",
      "version": "f38c57fa379b48b27f0acb5bcd751a4e-import { value } from '../lib';\nexport const result = value;\n",
      "signature": "9b81b256f3e78b27cca4c1cbf76e31fd-export declare const result: string;\n",
      "impliedNodeFormat": "CommonJS",
      "original": {
        "version": "f38c57fa379b48b27f0acb5bcd751a4e-import { value } from '../lib';\nexport const result = value;\n",
        "signature": "9b81b256f3e78b27cca4c1cbf76e31fd-export declare const result: string;\n",
        "impliedNodeFormat": 1
      }
    }
  ],
  "fileIdsList": [
    [
      "../lib/index.d.ts"
    ]
  ],
  "options": {
    "composite": true,
    "noEmitOnError": true
  },
  "referencedMap": {
    "./index.ts": [
      "../lib/index.d.ts"
    ]
  },
  "latestChangedDtsFile": "./index.d.ts",
  "size": 1432
}
//// [/home/src/workspaces/project/lib/index.d.ts] *new* 
export declare const value: string;

//// [/home/src/workspaces/project/lib/index.js] *new* 
export const value = 'fixed';

//// [/home/src/workspaces/project/lib/index.ts] *modified* 
export const value: string = 'fixed';

//// [/home/src/workspaces/project/lib/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"index.ts":"ed0dcb40700a1c248b307e921c81ca48"}},"version":"FakeTSVersion","root":[2],"fileNames":["lib.es2026.full.d.ts","./index.ts"],"fileInfos":[{"version":"8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true,"impliedNodeFormat":1},{"version":"060f626aa58a350969049e1f206d3a83-export const value: string = 'fixed';\n","signature":"d704bb9feb766d5360f4081857e4c09e-export declare const value: string;\n","impliedNodeFormat":1}],"options":{"composite":true,"noEmitOnError":true},"latestChangedDtsFile":"./index.d.ts"}
//// [/home/src/workspaces/project/lib/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "index.ts": "ed0dcb40700a1c248b307e921c81ca48"
    }
  },
  "version": "FakeTSVersion",
  "root": [
    {
      "files": [
        "./index.ts"
      ],
      "original": 2
    }
  ],
  "fileNames": [
    "lib.es2026.full.d.ts",
    "./index.ts"
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
      "fileName": "./index.ts",
      "version": "060f626aa58a350969049e1f206d3a83-export const value: string = 'fixed';\n",
      "signature": "d704bb9feb766d5360f4081857e4c09e-export declare const value: string;\n",
      "impliedNodeFormat": "CommonJS",
      "original": {
        "version": "060f626aa58a350969049e1f206d3a83-export const value: string = 'fixed';\n",
        "signature": "d704bb9feb766d5360f4081857e4c09e-export declare const value: string;\n",
        "impliedNodeFormat": 1
      }
    }
  ],
  "options": {
    "composite": true,
    "noEmitOnError": true
  },
  "latestChangedDtsFile": "./index.d.ts",
  "size": 1270
}

lib/tsconfig.json::
SemanticDiagnostics::
*refresh*    /home/src/workspaces/project/lib/index.ts
Signatures::
(computed .d.ts) /home/src/workspaces/project/lib/index.ts

app/tsconfig.json::
SemanticDiagnostics::
*refresh*    /home/src/tslibs/TS/Lib/lib.es2026.full.d.ts
*refresh*    /home/src/workspaces/project/lib/index.d.ts
*refresh*    /home/src/workspaces/project/app/index.ts
Signatures::
(stored at emit) /home/src/workspaces/project/app/index.ts


Edit [2]:: no change

tsgo -b . --stopBuildOnErrors --format
ExitStatus:: Success
Output::



Edit [3]:: propagate changed upstream declaration
//// [/home/src/workspaces/project/lib/index.ts] *modified* 
export const value:number=2;


tsgo -b . --stopBuildOnErrors --format
ExitStatus:: Success
Output::
//// [/home/src/workspaces/project/app/index.d.ts] *modified* 
export declare const result: number;

//// [/home/src/workspaces/project/app/index.js] *rewrite with same content*
//// [/home/src/workspaces/project/app/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"index.ts":"4b06a2f43fe39800d76334aa684bad31"}},"version":"FakeTSVersion","root":[3],"fileNames":["lib.es2026.full.d.ts","../lib/index.d.ts","./index.ts"],"fileInfos":[{"version":"8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true,"impliedNodeFormat":1},"959f06f4f5c31a065bcc12821a6027a2-export declare const value: number;\n",{"version":"f38c57fa379b48b27f0acb5bcd751a4e-import { value } from '../lib';\nexport const result = value;\n","signature":"a94472928cda3235e9d3fc6bdd8b2536-export declare const result: number;\n","impliedNodeFormat":1}],"fileIdsList":[[2]],"options":{"composite":true,"noEmitOnError":true},"referencedMap":[[3,1]],"latestChangedDtsFile":"./index.d.ts"}
//// [/home/src/workspaces/project/app/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "index.ts": "4b06a2f43fe39800d76334aa684bad31"
    }
  },
  "version": "FakeTSVersion",
  "root": [
    {
      "files": [
        "./index.ts"
      ],
      "original": 3
    }
  ],
  "fileNames": [
    "lib.es2026.full.d.ts",
    "../lib/index.d.ts",
    "./index.ts"
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
      "fileName": "../lib/index.d.ts",
      "version": "959f06f4f5c31a065bcc12821a6027a2-export declare const value: number;\n",
      "signature": "959f06f4f5c31a065bcc12821a6027a2-export declare const value: number;\n",
      "impliedNodeFormat": "CommonJS"
    },
    {
      "fileName": "./index.ts",
      "version": "f38c57fa379b48b27f0acb5bcd751a4e-import { value } from '../lib';\nexport const result = value;\n",
      "signature": "a94472928cda3235e9d3fc6bdd8b2536-export declare const result: number;\n",
      "impliedNodeFormat": "CommonJS",
      "original": {
        "version": "f38c57fa379b48b27f0acb5bcd751a4e-import { value } from '../lib';\nexport const result = value;\n",
        "signature": "a94472928cda3235e9d3fc6bdd8b2536-export declare const result: number;\n",
        "impliedNodeFormat": 1
      }
    }
  ],
  "fileIdsList": [
    [
      "../lib/index.d.ts"
    ]
  ],
  "options": {
    "composite": true,
    "noEmitOnError": true
  },
  "referencedMap": {
    "./index.ts": [
      "../lib/index.d.ts"
    ]
  },
  "latestChangedDtsFile": "./index.d.ts",
  "size": 1432
}
//// [/home/src/workspaces/project/lib/index.d.ts] *modified* 
export declare const value: number;

//// [/home/src/workspaces/project/lib/index.js] *modified* 
export const value = 2;

//// [/home/src/workspaces/project/lib/index.ts] *modified* 
export const value: number = 2;

//// [/home/src/workspaces/project/lib/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"index.ts":"214359f768918946414c7255d01be475"}},"version":"FakeTSVersion","root":[2],"fileNames":["lib.es2026.full.d.ts","./index.ts"],"fileInfos":[{"version":"8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true,"impliedNodeFormat":1},{"version":"81eb9a47b99939b0be2e525014896c86-export const value: number = 2;\n","signature":"959f06f4f5c31a065bcc12821a6027a2-export declare const value: number;\n","impliedNodeFormat":1}],"options":{"composite":true,"noEmitOnError":true},"latestChangedDtsFile":"./index.d.ts"}
//// [/home/src/workspaces/project/lib/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "index.ts": "214359f768918946414c7255d01be475"
    }
  },
  "version": "FakeTSVersion",
  "root": [
    {
      "files": [
        "./index.ts"
      ],
      "original": 2
    }
  ],
  "fileNames": [
    "lib.es2026.full.d.ts",
    "./index.ts"
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
      "fileName": "./index.ts",
      "version": "81eb9a47b99939b0be2e525014896c86-export const value: number = 2;\n",
      "signature": "959f06f4f5c31a065bcc12821a6027a2-export declare const value: number;\n",
      "impliedNodeFormat": "CommonJS",
      "original": {
        "version": "81eb9a47b99939b0be2e525014896c86-export const value: number = 2;\n",
        "signature": "959f06f4f5c31a065bcc12821a6027a2-export declare const value: number;\n",
        "impliedNodeFormat": 1
      }
    }
  ],
  "options": {
    "composite": true,
    "noEmitOnError": true
  },
  "latestChangedDtsFile": "./index.d.ts",
  "size": 1264
}

lib/tsconfig.json::
SemanticDiagnostics::
*refresh*    /home/src/workspaces/project/lib/index.ts
Signatures::
(computed .d.ts) /home/src/workspaces/project/lib/index.ts

app/tsconfig.json::
SemanticDiagnostics::
*refresh*    /home/src/workspaces/project/lib/index.d.ts
*refresh*    /home/src/workspaces/project/app/index.ts
Signatures::
(used version)   /home/src/workspaces/project/lib/index.d.ts
(computed .d.ts) /home/src/workspaces/project/app/index.ts


Edit [4]:: compile graph after formatting

tsgo -b . --stopBuildOnErrors
ExitStatus:: Success
Output::

