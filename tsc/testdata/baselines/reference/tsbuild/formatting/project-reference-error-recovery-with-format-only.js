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

tsgo -b . --stopBuildOnErrors --formatOnly
ExitStatus:: Success
Output::
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
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"index.ts":"7f3800615f44852c2db32f96a6a466d1"},"compilationPending":true},"version":"FakeTSVersion"}
//// [/home/src/workspaces/project/lib/tsconfig.tsbuildinfo.readable.baseline.txt] *new* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "index.ts": "7f3800615f44852c2db32f96a6a466d1"
    },
    "compilationPending": true
  },
  "version": "FakeTSVersion",
  "size": 169
}



Edit [0]:: no change

tsgo -b . --stopBuildOnErrors --formatOnly
ExitStatus:: Success
Output::



Edit [1]:: fix upstream semantic error
//// [/home/src/workspaces/project/lib/index.ts] *modified* 
export const value:string='fixed';


tsgo -b . --stopBuildOnErrors --formatOnly
ExitStatus:: Success
Output::
//// [/home/src/workspaces/project/lib/index.ts] *modified* 
export const value: string = 'fixed';

//// [/home/src/workspaces/project/lib/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"index.ts":"ed0dcb40700a1c248b307e921c81ca48"},"compilationPending":true},"version":"FakeTSVersion"}
//// [/home/src/workspaces/project/lib/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "index.ts": "ed0dcb40700a1c248b307e921c81ca48"
    },
    "compilationPending": true
  },
  "version": "FakeTSVersion",
  "size": 169
}



Edit [2]:: no change

tsgo -b . --stopBuildOnErrors --formatOnly
ExitStatus:: Success
Output::



Edit [3]:: propagate changed upstream declaration
//// [/home/src/workspaces/project/lib/index.ts] *modified* 
export const value:number=2;


tsgo -b . --stopBuildOnErrors --formatOnly
ExitStatus:: Success
Output::
//// [/home/src/workspaces/project/lib/index.ts] *modified* 
export const value: number = 2;

//// [/home/src/workspaces/project/lib/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"index.ts":"214359f768918946414c7255d01be475"},"compilationPending":true},"version":"FakeTSVersion"}
//// [/home/src/workspaces/project/lib/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "index.ts": "214359f768918946414c7255d01be475"
    },
    "compilationPending": true
  },
  "version": "FakeTSVersion",
  "size": 169
}



Edit [4]:: compile graph after formatting

tsgo -b . --stopBuildOnErrors
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
//// [/home/src/workspaces/project/app/index.d.ts] *new* 
export declare const result: number;

//// [/home/src/workspaces/project/app/index.js] *new* 
import { value } from '../lib';
export const result = value;

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
//// [/home/src/workspaces/project/lib/index.d.ts] *new* 
export declare const value: number;

//// [/home/src/workspaces/project/lib/index.js] *new* 
export const value = 2;

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
*refresh*    /home/src/tslibs/TS/Lib/lib.es2026.full.d.ts
*refresh*    /home/src/workspaces/project/lib/index.ts
Signatures::
(stored at emit) /home/src/workspaces/project/lib/index.ts

app/tsconfig.json::
SemanticDiagnostics::
*refresh*    /home/src/tslibs/TS/Lib/lib.es2026.full.d.ts
*refresh*    /home/src/workspaces/project/lib/index.d.ts
*refresh*    /home/src/workspaces/project/app/index.ts
Signatures::
(stored at emit) /home/src/workspaces/project/app/index.ts
