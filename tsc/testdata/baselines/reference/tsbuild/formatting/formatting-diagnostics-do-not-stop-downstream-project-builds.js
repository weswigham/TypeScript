currentDirectory::/home/src/workspaces/project
useCaseSensitiveFileNames::true
Input::
//// [/home/src/workspaces/project/app/index.ts] *new* 
import {value} from '../lib';
export const result=value;

//// [/home/src/workspaces/project/app/tsconfig.json] *new* 
{"compilerOptions":{"composite":true,"noEmitOnError":true},"references":[{"path":"../lib"}],"files":["index.ts"]}
//// [/home/src/workspaces/project/lib/index.ts] *new* 
export const value=1;

//// [/home/src/workspaces/project/lib/tsconfig.json] *new* 
{"compilerOptions":{"composite":true,"noEmitOnError":true},"files":["index.ts"]}
//// [/home/src/workspaces/project/tsconfig.json] *new* 
{"files":[],"references":[{"path":"./app"}]}

tsgo -b --format --formatDiagnostics --stopBuildOnErrors .
ExitStatus:: DiagnosticsPresent_OutputsGenerated
Output::
[96mlib/index.ts[0m:[93m1[0m:[93m19[0m - [91merror[0m[90m TS18133: [0mExpected a space before the binary operator '='.

[7m1[0m export const value=1;
[7m [0m [91m                  ~[0m

[96mlib/index.ts[0m:[93m1[0m:[93m20[0m - [91merror[0m[90m TS18134: [0mExpected a space after the binary operator '='.

[7m1[0m export const value=1;
[7m [0m [91m                   ~[0m

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


Found 6 errors in 2 files.

Errors  Files
     4  app/index.ts[90m:1[0m
     2  lib/index.ts[90m:1[0m

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
export declare const result = 1;

//// [/home/src/workspaces/project/app/index.js] *new* 
import { value } from '../lib';
export const result = value;

//// [/home/src/workspaces/project/app/tsconfig.tsbuildinfo] *new* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{}},"version":"FakeTSVersion","root":[3],"fileNames":["lib.es2026.full.d.ts","../lib/index.d.ts","./index.ts"],"fileInfos":[{"version":"8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true,"impliedNodeFormat":1},"ba5c8ef2b0978fc944b312728d63c3f1-export declare const value = 1;\n",{"version":"a6462e9ebc23b8ce8fc721c3b0d3d581-import {value} from '../lib';\nexport const result=value;\n","signature":"993e425aeb82a5fb982b8b91a1f7366e-export declare const result = 1;\n","impliedNodeFormat":1}],"fileIdsList":[[2]],"options":{"composite":true,"noEmitOnError":true},"referencedMap":[[3,1]],"latestChangedDtsFile":"./index.d.ts"}
//// [/home/src/workspaces/project/app/tsconfig.tsbuildinfo.readable.baseline.txt] *new* 
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
      "version": "ba5c8ef2b0978fc944b312728d63c3f1-export declare const value = 1;\n",
      "signature": "ba5c8ef2b0978fc944b312728d63c3f1-export declare const value = 1;\n",
      "impliedNodeFormat": "CommonJS"
    },
    {
      "fileName": "./index.ts",
      "version": "a6462e9ebc23b8ce8fc721c3b0d3d581-import {value} from '../lib';\nexport const result=value;\n",
      "signature": "993e425aeb82a5fb982b8b91a1f7366e-export declare const result = 1;\n",
      "impliedNodeFormat": "CommonJS",
      "original": {
        "version": "a6462e9ebc23b8ce8fc721c3b0d3d581-import {value} from '../lib';\nexport const result=value;\n",
        "signature": "993e425aeb82a5fb982b8b91a1f7366e-export declare const result = 1;\n",
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
  "size": 1375
}
//// [/home/src/workspaces/project/lib/index.d.ts] *new* 
export declare const value = 1;

//// [/home/src/workspaces/project/lib/index.js] *new* 
export const value = 1;

//// [/home/src/workspaces/project/lib/tsconfig.tsbuildinfo] *new* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{}},"version":"FakeTSVersion","root":[2],"fileNames":["lib.es2026.full.d.ts","./index.ts"],"fileInfos":[{"version":"8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true,"impliedNodeFormat":1},{"version":"b4c4e77cd2d7bce23a4c42d880809979-export const value=1;\n","signature":"ba5c8ef2b0978fc944b312728d63c3f1-export declare const value = 1;\n","impliedNodeFormat":1}],"options":{"composite":true,"noEmitOnError":true},"latestChangedDtsFile":"./index.d.ts"}
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
      "version": "b4c4e77cd2d7bce23a4c42d880809979-export const value=1;\n",
      "signature": "ba5c8ef2b0978fc944b312728d63c3f1-export declare const value = 1;\n",
      "impliedNodeFormat": "CommonJS",
      "original": {
        "version": "b4c4e77cd2d7bce23a4c42d880809979-export const value=1;\n",
        "signature": "ba5c8ef2b0978fc944b312728d63c3f1-export declare const value = 1;\n",
        "impliedNodeFormat": 1
      }
    }
  ],
  "options": {
    "composite": true,
    "noEmitOnError": true
  },
  "latestChangedDtsFile": "./index.d.ts",
  "size": 1205
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


Edit [0]:: no change

tsgo -b --format --formatDiagnostics --stopBuildOnErrors .
ExitStatus:: DiagnosticsPresent_OutputsGenerated
Output::
[96mlib/index.ts[0m:[93m1[0m:[93m19[0m - [91merror[0m[90m TS18133: [0mExpected a space before the binary operator '='.

[7m1[0m export const value=1;
[7m [0m [91m                  ~[0m

[96mlib/index.ts[0m:[93m1[0m:[93m20[0m - [91merror[0m[90m TS18134: [0mExpected a space after the binary operator '='.

[7m1[0m export const value=1;
[7m [0m [91m                   ~[0m

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


Found 6 errors in 2 files.

Errors  Files
     4  app/index.ts[90m:1[0m
     2  lib/index.ts[90m:1[0m

//// [/home/src/workspaces/project/app/tsconfig.tsbuildinfo] *mTime changed*
//// [/home/src/workspaces/project/lib/tsconfig.tsbuildinfo] *mTime changed*

lib/tsconfig.json::
SemanticDiagnostics::
Signatures::

app/tsconfig.json::
SemanticDiagnostics::
Signatures::


Edit [1]:: build changed dependency and downstream project
//// [/home/src/workspaces/project/lib/index.ts] *modified* 
export const value=2;


tsgo -b --format --formatDiagnostics --stopBuildOnErrors .
ExitStatus:: DiagnosticsPresent_OutputsGenerated
Output::
[96mlib/index.ts[0m:[93m1[0m:[93m19[0m - [91merror[0m[90m TS18133: [0mExpected a space before the binary operator '='.

[7m1[0m export const value=2;
[7m [0m [91m                  ~[0m

[96mlib/index.ts[0m:[93m1[0m:[93m20[0m - [91merror[0m[90m TS18134: [0mExpected a space after the binary operator '='.

[7m1[0m export const value=2;
[7m [0m [91m                   ~[0m

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


Found 6 errors in 2 files.

Errors  Files
     4  app/index.ts[90m:1[0m
     2  lib/index.ts[90m:1[0m

//// [/home/src/workspaces/project/app/index.d.ts] *modified* 
export declare const result = 2;

//// [/home/src/workspaces/project/app/index.js] *rewrite with same content*
//// [/home/src/workspaces/project/app/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{}},"version":"FakeTSVersion","root":[3],"fileNames":["lib.es2026.full.d.ts","../lib/index.d.ts","./index.ts"],"fileInfos":[{"version":"8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true,"impliedNodeFormat":1},"01d66afd6cdf017c55f77385189bc8c1-export declare const value = 2;\n",{"version":"a6462e9ebc23b8ce8fc721c3b0d3d581-import {value} from '../lib';\nexport const result=value;\n","signature":"fe37564091d96cef2a6089a0ef4dd3d4-export declare const result = 2;\n","impliedNodeFormat":1}],"fileIdsList":[[2]],"options":{"composite":true,"noEmitOnError":true},"referencedMap":[[3,1]],"latestChangedDtsFile":"./index.d.ts"}
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
      "version": "01d66afd6cdf017c55f77385189bc8c1-export declare const value = 2;\n",
      "signature": "01d66afd6cdf017c55f77385189bc8c1-export declare const value = 2;\n",
      "impliedNodeFormat": "CommonJS"
    },
    {
      "fileName": "./index.ts",
      "version": "a6462e9ebc23b8ce8fc721c3b0d3d581-import {value} from '../lib';\nexport const result=value;\n",
      "signature": "fe37564091d96cef2a6089a0ef4dd3d4-export declare const result = 2;\n",
      "impliedNodeFormat": "CommonJS",
      "original": {
        "version": "a6462e9ebc23b8ce8fc721c3b0d3d581-import {value} from '../lib';\nexport const result=value;\n",
        "signature": "fe37564091d96cef2a6089a0ef4dd3d4-export declare const result = 2;\n",
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
  "size": 1375
}
//// [/home/src/workspaces/project/lib/index.d.ts] *modified* 
export declare const value = 2;

//// [/home/src/workspaces/project/lib/index.js] *modified* 
export const value = 2;

//// [/home/src/workspaces/project/lib/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{}},"version":"FakeTSVersion","root":[2],"fileNames":["lib.es2026.full.d.ts","./index.ts"],"fileInfos":[{"version":"8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true,"impliedNodeFormat":1},{"version":"c55455f2c4ce0f75e2f5ef32b57b16ed-export const value=2;\n","signature":"01d66afd6cdf017c55f77385189bc8c1-export declare const value = 2;\n","impliedNodeFormat":1}],"options":{"composite":true,"noEmitOnError":true},"latestChangedDtsFile":"./index.d.ts"}
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
      "version": "c55455f2c4ce0f75e2f5ef32b57b16ed-export const value=2;\n",
      "signature": "01d66afd6cdf017c55f77385189bc8c1-export declare const value = 2;\n",
      "impliedNodeFormat": "CommonJS",
      "original": {
        "version": "c55455f2c4ce0f75e2f5ef32b57b16ed-export const value=2;\n",
        "signature": "01d66afd6cdf017c55f77385189bc8c1-export declare const value = 2;\n",
        "impliedNodeFormat": 1
      }
    }
  ],
  "options": {
    "composite": true,
    "noEmitOnError": true
  },
  "latestChangedDtsFile": "./index.d.ts",
  "size": 1205
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
