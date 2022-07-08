Input::
//// [/lib/lib.d.ts]
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
declare const console: { log(msg: any): void; };

//// [/src/project/src/file.ts]
export const y: string = undefined;

//// [/src/project/src/main.ts]
export const x = 10;



Output::
/lib/tsc --incremental --tsBuildInfoFile .tsbuildinfo --strict src/project/src/main.ts
exitCode:: ExitStatus.Success


//// [/.tsbuildinfo]
{"program":{"fileNames":["./lib/lib.d.ts","./src/project/src/main.ts"],"fileInfos":[{"version":"3858781397-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true},"-10726455937-export const x = 10;"],"options":{"strict":true,"tsBuildInfoFile":"./.tsbuildinfo"},"referencedMap":[],"exportedModulesMap":[],"semanticDiagnosticsPerFile":[1,2]},"version":"FakeTSVersion"}

//// [/.tsbuildinfo.readable.baseline.txt]
{
  "program": {
    "fileNames": [
      "./lib/lib.d.ts",
      "./src/project/src/main.ts"
    ],
    "fileInfos": {
      "./lib/lib.d.ts": {
        "version": "3858781397-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ndeclare const console: { log(msg: any): void; };",
        "signature": "3858781397-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ndeclare const console: { log(msg: any): void; };",
        "affectsGlobalScope": true
      },
      "./src/project/src/main.ts": {
        "version": "-10726455937-export const x = 10;",
        "signature": "-10726455937-export const x = 10;"
      }
    },
    "options": {
      "strict": true,
      "tsBuildInfoFile": "./.tsbuildinfo"
    },
    "referencedMap": {},
    "exportedModulesMap": {},
    "semanticDiagnosticsPerFile": [
      "./lib/lib.d.ts",
      "./src/project/src/main.ts"
    ]
  },
  "version": "FakeTSVersion",
  "size": 766
}

//// [/src/project/src/main.js]
"use strict";
exports.__esModule = true;
exports.x = void 0;
exports.x = 10;




next:

Input::
//// [/.tsbuildinfo]
{"program":{"fileNames":["./lib/lib.d.ts","./src/project/src/main.ts"],"fileInfos":[{"version":"3858781397-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true},"-10726455937-export const x = 10;"],"options":{"strict":true,"tsBuildInfoFile":"./.tsbuildinfo"},"referencedMap":[],"exportedModulesMap":[],"semanticDiagnosticsPerFile":[1,2]},"version":"FakeTSVersion"}

//// [/.tsbuildinfo.readable.baseline.txt]
{
  "program": {
    "fileNames": [
      "./lib/lib.d.ts",
      "./src/project/src/main.ts"
    ],
    "fileInfos": {
      "./lib/lib.d.ts": {
        "version": "3858781397-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ndeclare const console: { log(msg: any): void; };",
        "signature": "3858781397-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ndeclare const console: { log(msg: any): void; };",
        "affectsGlobalScope": true
      },
      "./src/project/src/main.ts": {
        "version": "-10726455937-export const x = 10;",
        "signature": "-10726455937-export const x = 10;"
      }
    },
    "options": {
      "strict": true,
      "tsBuildInfoFile": "./.tsbuildinfo"
    },
    "referencedMap": {},
    "exportedModulesMap": {},
    "semanticDiagnosticsPerFile": [
      "./lib/lib.d.ts",
      "./src/project/src/main.ts"
    ]
  },
  "version": "FakeTSVersion",
  "size": 766
}

//// [/lib/lib.d.ts]
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
declare const console: { log(msg: any): void; };

//// [/src/project/src/file.ts]
export const y: string = undefined;

//// [/src/project/src/main.js]
"use strict";
exports.__esModule = true;
exports.x = void 0;
exports.x = 10;


//// [/src/project/src/main.ts]
export const x = 10;



Output::
/lib/tsc --incremental --tsBuildInfoFile .tsbuildinfo --strict src/project/src/file.ts
[96msrc/project/src/file.ts[0m:[93m1[0m:[93m14[0m - [91merror[0m[90m TS2322: [0mType 'undefined' is not assignable to type 'string'.

[7m1[0m export const y: string = undefined;
[7m [0m [91m             ~[0m


Found 1 error in src/project/src/file.ts[90m:1[0m

exitCode:: ExitStatus.DiagnosticsPresent_OutputsGenerated


//// [/.tsbuildinfo]
{"program":{"fileNames":["./lib/lib.d.ts","./src/project/src/file.ts"],"fileInfos":[{"version":"3858781397-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true},{"version":"-14519709726-export const y: string = undefined;","signature":"-8102077254-export declare const y: string;\r\n"}],"options":{"strict":true,"tsBuildInfoFile":"./.tsbuildinfo"},"referencedMap":[],"exportedModulesMap":[],"semanticDiagnosticsPerFile":[1,[2,[{"file":"./src/project/src/file.ts","start":13,"length":1,"code":2322,"category":1,"messageText":"Type 'undefined' is not assignable to type 'string'."}]]]},"version":"FakeTSVersion"}

//// [/.tsbuildinfo.readable.baseline.txt]
{
  "program": {
    "fileNames": [
      "./lib/lib.d.ts",
      "./src/project/src/file.ts"
    ],
    "fileInfos": {
      "./lib/lib.d.ts": {
        "version": "3858781397-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ndeclare const console: { log(msg: any): void; };",
        "signature": "3858781397-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ndeclare const console: { log(msg: any): void; };",
        "affectsGlobalScope": true
      },
      "./src/project/src/file.ts": {
        "version": "-14519709726-export const y: string = undefined;",
        "signature": "-8102077254-export declare const y: string;\r\n"
      }
    },
    "options": {
      "strict": true,
      "tsBuildInfoFile": "./.tsbuildinfo"
    },
    "referencedMap": {},
    "exportedModulesMap": {},
    "semanticDiagnosticsPerFile": [
      "./lib/lib.d.ts",
      [
        "./src/project/src/file.ts",
        [
          {
            "file": "./src/project/src/file.ts",
            "start": 13,
            "length": 1,
            "code": 2322,
            "category": 1,
            "messageText": "Type 'undefined' is not assignable to type 'string'."
          }
        ]
      ]
    ]
  },
  "version": "FakeTSVersion",
  "size": 1012
}

//// [/src/project/src/file.js]
"use strict";
exports.__esModule = true;
exports.y = void 0;
exports.y = undefined;


