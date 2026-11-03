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

tsgo -b . --stopBuildOnErrors --format --formatDiagnostics
ExitStatus:: DiagnosticsPresent_OutputsSkipped
Output::
[96mlib/index.ts[0m:[93m1[0m:[93m14[0m - [91merror[0m[90m TS2322: [0mType 'number' is not assignable to type 'string'.

[7m1[0m export const value:string=1;
[7m [0m [91m             ~~~~~[0m

[96mlib/index.ts[0m:[93m1[0m:[93m20[0m - [91merror[0m[90m TS18141: [0mExpected a space after ':'.

[7m1[0m export const value:string=1;
[7m [0m [91m                   ~[0m

[96mlib/index.ts[0m:[93m1[0m:[93m26[0m - [91merror[0m[90m TS18133: [0mExpected a space before the binary operator '='.

[7m1[0m export const value:string=1;
[7m [0m [91m                         ~[0m

[96mlib/index.ts[0m:[93m1[0m:[93m27[0m - [91merror[0m[90m TS18134: [0mExpected a space after the binary operator '='.

[7m1[0m export const value:string=1;
[7m [0m [91m                          ~[0m

[96mapp/index.ts[0m:[93m1[0m:[93m9[0m - [91merror[0m[90m TS18141: [0mExpected a space after '{'.

[7m1[0m import {value} from '../lib';
[7m [0m [91m        ~[0m

[96mapp/index.ts[0m:[93m1[0m:[93m14[0m - [91merror[0m[90m TS18140: [0mExpected a space before '}'.

[7m1[0m import {value} from '../lib';
[7m [0m [91m             ~[0m

[96mapp/index.ts[0m:[93m2[0m:[93m20[0m - [91merror[0m[90m TS18133: [0mExpected a space before the binary operator '='.

[7m2[0m export const result=value;
[7m [0m [91m                   ~[0m

[96mapp/index.ts[0m:[93m2[0m:[93m21[0m - [91merror[0m[90m TS18134: [0mExpected a space after the binary operator '='.

[7m2[0m export const result=value;
[7m [0m [91m                    ~[0m


Found 8 errors in 2 files.

Errors  Files
     4  app/index.ts[90m:1[0m
     4  lib/index.ts[90m:1[0m

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
//// [/home/src/workspaces/project/app/tsconfig.tsbuildinfo] *new* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{},"compilationPending":true},"version":"FakeTSVersion"}
//// [/home/src/workspaces/project/app/tsconfig.tsbuildinfo.readable.baseline.txt] *new* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {},
    "compilationPending": true
  },
  "version": "FakeTSVersion",
  "size": 124
}
//// [/home/src/workspaces/project/lib/tsconfig.tsbuildinfo] *new* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{}},"version":"FakeTSVersion","root":[2],"fileNames":["lib.es2026.full.d.ts","./index.ts"],"fileInfos":[{"version":"8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true,"impliedNodeFormat":1},"e21043fccb7a9ad2482890c65f6282b2-export const value:string=1;\n"],"options":{"composite":true,"noEmitOnError":true},"semanticDiagnosticsPerFile":[[2,[{"pos":13,"end":18,"code":2322,"category":1,"messageKey":"Type_0_is_not_assignable_to_type_1_2322","messageArgs":["number","string"]}]]],"affectedFilesPendingEmit":[2],"emitSignatures":[2]}
//// [/home/src/workspaces/project/lib/tsconfig.tsbuildinfo.readable.baseline.txt] *new* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {}
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
      "version": "e21043fccb7a9ad2482890c65f6282b2-export const value:string=1;\n",
      "signature": "e21043fccb7a9ad2482890c65f6282b2-export const value:string=1;\n",
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
  "size": 1282
}

lib/tsconfig.json::
SemanticDiagnostics::
*refresh*    /home/src/tslibs/TS/Lib/lib.es2026.full.d.ts
*refresh*    /home/src/workspaces/project/lib/index.ts
Signatures::


Edit [0]:: no change

tsgo -b . --stopBuildOnErrors --format --formatDiagnostics
ExitStatus:: DiagnosticsPresent_OutputsSkipped
Output::
[96mlib/index.ts[0m:[93m1[0m:[93m14[0m - [91merror[0m[90m TS2322: [0mType 'number' is not assignable to type 'string'.

[7m1[0m export const value:string=1;
[7m [0m [91m             ~~~~~[0m

[96mlib/index.ts[0m:[93m1[0m:[93m20[0m - [91merror[0m[90m TS18141: [0mExpected a space after ':'.

[7m1[0m export const value:string=1;
[7m [0m [91m                   ~[0m

[96mlib/index.ts[0m:[93m1[0m:[93m26[0m - [91merror[0m[90m TS18133: [0mExpected a space before the binary operator '='.

[7m1[0m export const value:string=1;
[7m [0m [91m                         ~[0m

[96mlib/index.ts[0m:[93m1[0m:[93m27[0m - [91merror[0m[90m TS18134: [0mExpected a space after the binary operator '='.

[7m1[0m export const value:string=1;
[7m [0m [91m                          ~[0m

[96mapp/index.ts[0m:[93m1[0m:[93m9[0m - [91merror[0m[90m TS18141: [0mExpected a space after '{'.

[7m1[0m import {value} from '../lib';
[7m [0m [91m        ~[0m

[96mapp/index.ts[0m:[93m1[0m:[93m14[0m - [91merror[0m[90m TS18140: [0mExpected a space before '}'.

[7m1[0m import {value} from '../lib';
[7m [0m [91m             ~[0m

[96mapp/index.ts[0m:[93m2[0m:[93m20[0m - [91merror[0m[90m TS18133: [0mExpected a space before the binary operator '='.

[7m2[0m export const result=value;
[7m [0m [91m                   ~[0m

[96mapp/index.ts[0m:[93m2[0m:[93m21[0m - [91merror[0m[90m TS18134: [0mExpected a space after the binary operator '='.

[7m2[0m export const result=value;
[7m [0m [91m                    ~[0m


Found 8 errors in 2 files.

Errors  Files
     4  app/index.ts[90m:1[0m
     4  lib/index.ts[90m:1[0m


lib/tsconfig.json::
SemanticDiagnostics::
Signatures::


Edit [1]:: fix upstream semantic error
//// [/home/src/workspaces/project/lib/index.ts] *modified* 
export const value:string='fixed';


tsgo -b . --stopBuildOnErrors --format --formatDiagnostics
ExitStatus:: DiagnosticsPresent_OutputsGenerated
Output::
[96mlib/index.ts[0m:[93m1[0m:[93m20[0m - [91merror[0m[90m TS18141: [0mExpected a space after ':'.

[7m1[0m export const value:string='fixed';
[7m [0m [91m                   ~[0m

[96mlib/index.ts[0m:[93m1[0m:[93m26[0m - [91merror[0m[90m TS18133: [0mExpected a space before the binary operator '='.

[7m1[0m export const value:string='fixed';
[7m [0m [91m                         ~[0m

[96mlib/index.ts[0m:[93m1[0m:[93m27[0m - [91merror[0m[90m TS18134: [0mExpected a space after the binary operator '='.

[7m1[0m export const value:string='fixed';
[7m [0m [91m                          ~[0m

[96mapp/index.ts[0m:[93m1[0m:[93m9[0m - [91merror[0m[90m TS18141: [0mExpected a space after '{'.

[7m1[0m import {value} from '../lib';
[7m [0m [91m        ~[0m

[96mapp/index.ts[0m:[93m1[0m:[93m14[0m - [91merror[0m[90m TS18140: [0mExpected a space before '}'.

[7m1[0m import {value} from '../lib';
[7m [0m [91m             ~[0m

[96mapp/index.ts[0m:[93m2[0m:[93m20[0m - [91merror[0m[90m TS18133: [0mExpected a space before the binary operator '='.

[7m2[0m export const result=value;
[7m [0m [91m                   ~[0m

[96mapp/index.ts[0m:[93m2[0m:[93m21[0m - [91merror[0m[90m TS18134: [0mExpected a space after the binary operator '='.

[7m2[0m export const result=value;
[7m [0m [91m                    ~[0m


Found 7 errors in 2 files.

Errors  Files
     4  app/index.ts[90m:1[0m
     3  lib/index.ts[90m:1[0m

//// [/home/src/workspaces/project/app/index.d.ts] *new* 
export declare const result: string;

//// [/home/src/workspaces/project/app/index.js] *new* 
import { value } from '../lib';
export const result = value;

//// [/home/src/workspaces/project/app/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{}},"version":"FakeTSVersion","root":[3],"fileNames":["lib.es2026.full.d.ts","../lib/index.d.ts","./index.ts"],"fileInfos":[{"version":"8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true,"impliedNodeFormat":1},"d704bb9feb766d5360f4081857e4c09e-export declare const value: string;\n",{"version":"a6462e9ebc23b8ce8fc721c3b0d3d581-import {value} from '../lib';\nexport const result=value;\n","signature":"9b81b256f3e78b27cca4c1cbf76e31fd-export declare const result: string;\n","impliedNodeFormat":1}],"fileIdsList":[[2]],"options":{"composite":true,"noEmitOnError":true},"referencedMap":[[3,1]],"latestChangedDtsFile":"./index.d.ts"}
//// [/home/src/workspaces/project/app/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {}
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
      "version": "a6462e9ebc23b8ce8fc721c3b0d3d581-import {value} from '../lib';\nexport const result=value;\n",
      "signature": "9b81b256f3e78b27cca4c1cbf76e31fd-export declare const result: string;\n",
      "impliedNodeFormat": "CommonJS",
      "original": {
        "version": "a6462e9ebc23b8ce8fc721c3b0d3d581-import {value} from '../lib';\nexport const result=value;\n",
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
  "size": 1383
}
//// [/home/src/workspaces/project/lib/index.d.ts] *new* 
export declare const value: string;

//// [/home/src/workspaces/project/lib/index.js] *new* 
export const value = 'fixed';

//// [/home/src/workspaces/project/lib/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{}},"version":"FakeTSVersion","root":[2],"fileNames":["lib.es2026.full.d.ts","./index.ts"],"fileInfos":[{"version":"8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true,"impliedNodeFormat":1},{"version":"2c45f831788bd7a3065b793002df449f-export const value:string='fixed';\n","signature":"d704bb9feb766d5360f4081857e4c09e-export declare const value: string;\n","impliedNodeFormat":1}],"options":{"composite":true,"noEmitOnError":true},"latestChangedDtsFile":"./index.d.ts"}
//// [/home/src/workspaces/project/lib/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {}
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
      "version": "2c45f831788bd7a3065b793002df449f-export const value:string='fixed';\n",
      "signature": "d704bb9feb766d5360f4081857e4c09e-export declare const value: string;\n",
      "impliedNodeFormat": "CommonJS",
      "original": {
        "version": "2c45f831788bd7a3065b793002df449f-export const value:string='fixed';\n",
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
  "size": 1222
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

tsgo -b . --stopBuildOnErrors --format --formatDiagnostics
ExitStatus:: DiagnosticsPresent_OutputsGenerated
Output::
[96mlib/index.ts[0m:[93m1[0m:[93m20[0m - [91merror[0m[90m TS18141: [0mExpected a space after ':'.

[7m1[0m export const value:string='fixed';
[7m [0m [91m                   ~[0m

[96mlib/index.ts[0m:[93m1[0m:[93m26[0m - [91merror[0m[90m TS18133: [0mExpected a space before the binary operator '='.

[7m1[0m export const value:string='fixed';
[7m [0m [91m                         ~[0m

[96mlib/index.ts[0m:[93m1[0m:[93m27[0m - [91merror[0m[90m TS18134: [0mExpected a space after the binary operator '='.

[7m1[0m export const value:string='fixed';
[7m [0m [91m                          ~[0m

[96mapp/index.ts[0m:[93m1[0m:[93m9[0m - [91merror[0m[90m TS18141: [0mExpected a space after '{'.

[7m1[0m import {value} from '../lib';
[7m [0m [91m        ~[0m

[96mapp/index.ts[0m:[93m1[0m:[93m14[0m - [91merror[0m[90m TS18140: [0mExpected a space before '}'.

[7m1[0m import {value} from '../lib';
[7m [0m [91m             ~[0m

[96mapp/index.ts[0m:[93m2[0m:[93m20[0m - [91merror[0m[90m TS18133: [0mExpected a space before the binary operator '='.

[7m2[0m export const result=value;
[7m [0m [91m                   ~[0m

[96mapp/index.ts[0m:[93m2[0m:[93m21[0m - [91merror[0m[90m TS18134: [0mExpected a space after the binary operator '='.

[7m2[0m export const result=value;
[7m [0m [91m                    ~[0m


Found 7 errors in 2 files.

Errors  Files
     4  app/index.ts[90m:1[0m
     3  lib/index.ts[90m:1[0m

//// [/home/src/workspaces/project/app/tsconfig.tsbuildinfo] *mTime changed*
//// [/home/src/workspaces/project/lib/tsconfig.tsbuildinfo] *mTime changed*

lib/tsconfig.json::
SemanticDiagnostics::
Signatures::

app/tsconfig.json::
SemanticDiagnostics::
Signatures::


Edit [3]:: propagate changed upstream declaration
//// [/home/src/workspaces/project/lib/index.ts] *modified* 
export const value:number=2;


tsgo -b . --stopBuildOnErrors --format --formatDiagnostics
ExitStatus:: DiagnosticsPresent_OutputsGenerated
Output::
[96mlib/index.ts[0m:[93m1[0m:[93m20[0m - [91merror[0m[90m TS18141: [0mExpected a space after ':'.

[7m1[0m export const value:number=2;
[7m [0m [91m                   ~[0m

[96mlib/index.ts[0m:[93m1[0m:[93m26[0m - [91merror[0m[90m TS18133: [0mExpected a space before the binary operator '='.

[7m1[0m export const value:number=2;
[7m [0m [91m                         ~[0m

[96mlib/index.ts[0m:[93m1[0m:[93m27[0m - [91merror[0m[90m TS18134: [0mExpected a space after the binary operator '='.

[7m1[0m export const value:number=2;
[7m [0m [91m                          ~[0m

[96mapp/index.ts[0m:[93m1[0m:[93m9[0m - [91merror[0m[90m TS18141: [0mExpected a space after '{'.

[7m1[0m import {value} from '../lib';
[7m [0m [91m        ~[0m

[96mapp/index.ts[0m:[93m1[0m:[93m14[0m - [91merror[0m[90m TS18140: [0mExpected a space before '}'.

[7m1[0m import {value} from '../lib';
[7m [0m [91m             ~[0m

[96mapp/index.ts[0m:[93m2[0m:[93m20[0m - [91merror[0m[90m TS18133: [0mExpected a space before the binary operator '='.

[7m2[0m export const result=value;
[7m [0m [91m                   ~[0m

[96mapp/index.ts[0m:[93m2[0m:[93m21[0m - [91merror[0m[90m TS18134: [0mExpected a space after the binary operator '='.

[7m2[0m export const result=value;
[7m [0m [91m                    ~[0m


Found 7 errors in 2 files.

Errors  Files
     4  app/index.ts[90m:1[0m
     3  lib/index.ts[90m:1[0m

//// [/home/src/workspaces/project/app/index.d.ts] *modified* 
export declare const result: number;

//// [/home/src/workspaces/project/app/index.js] *rewrite with same content*
//// [/home/src/workspaces/project/app/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{}},"version":"FakeTSVersion","root":[3],"fileNames":["lib.es2026.full.d.ts","../lib/index.d.ts","./index.ts"],"fileInfos":[{"version":"8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true,"impliedNodeFormat":1},"959f06f4f5c31a065bcc12821a6027a2-export declare const value: number;\n",{"version":"a6462e9ebc23b8ce8fc721c3b0d3d581-import {value} from '../lib';\nexport const result=value;\n","signature":"a94472928cda3235e9d3fc6bdd8b2536-export declare const result: number;\n","impliedNodeFormat":1}],"fileIdsList":[[2]],"options":{"composite":true,"noEmitOnError":true},"referencedMap":[[3,1]],"latestChangedDtsFile":"./index.d.ts"}
//// [/home/src/workspaces/project/app/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {}
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
      "version": "a6462e9ebc23b8ce8fc721c3b0d3d581-import {value} from '../lib';\nexport const result=value;\n",
      "signature": "a94472928cda3235e9d3fc6bdd8b2536-export declare const result: number;\n",
      "impliedNodeFormat": "CommonJS",
      "original": {
        "version": "a6462e9ebc23b8ce8fc721c3b0d3d581-import {value} from '../lib';\nexport const result=value;\n",
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
  "size": 1383
}
//// [/home/src/workspaces/project/lib/index.d.ts] *modified* 
export declare const value: number;

//// [/home/src/workspaces/project/lib/index.js] *modified* 
export const value = 2;

//// [/home/src/workspaces/project/lib/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{}},"version":"FakeTSVersion","root":[2],"fileNames":["lib.es2026.full.d.ts","./index.ts"],"fileInfos":[{"version":"8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true,"impliedNodeFormat":1},{"version":"d24aa9a02a611051885f46718747ed8d-export const value:number=2;\n","signature":"959f06f4f5c31a065bcc12821a6027a2-export declare const value: number;\n","impliedNodeFormat":1}],"options":{"composite":true,"noEmitOnError":true},"latestChangedDtsFile":"./index.d.ts"}
//// [/home/src/workspaces/project/lib/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {}
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
      "version": "d24aa9a02a611051885f46718747ed8d-export const value:number=2;\n",
      "signature": "959f06f4f5c31a065bcc12821a6027a2-export declare const value: number;\n",
      "impliedNodeFormat": "CommonJS",
      "original": {
        "version": "d24aa9a02a611051885f46718747ed8d-export const value:number=2;\n",
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
  "size": 1216
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

