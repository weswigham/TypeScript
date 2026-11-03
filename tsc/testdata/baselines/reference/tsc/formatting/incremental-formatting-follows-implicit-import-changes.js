currentDirectory::/home/src/workspaces/project
useCaseSensitiveFileNames::true
Input::
//// [/home/src/workspaces/project/hidden/helper.ts] *new* 
export const value=1;

//// [/home/src/workspaces/project/input.ts] *new* 
import {value} from './hidden/helper';
export const result=value;

//// [/home/src/workspaces/project/tsconfig.json] *new* 
{"compilerOptions":{"incremental":true},"files":["input.ts"],"exclude":["hidden"]}

tsgo --formatOnly -p .
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
//// [/home/src/workspaces/project/hidden/helper.ts] *modified* 
export const value = 1;

//// [/home/src/workspaces/project/input.ts] *modified* 
import { value } from './hidden/helper';
export const result = value;

//// [/home/src/workspaces/project/tsconfig.tsbuildinfo] *new* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"input.ts":"f8427906cba5adbc5fa8fbef004eb426","hidden/helper.ts":"9cd2c142856e74e1c88b90c843c2e996"},"compilationPending":true},"version":"FakeTSVersion"}
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo.readable.baseline.txt] *new* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "input.ts": "f8427906cba5adbc5fa8fbef004eb426",
      "hidden/helper.ts": "9cd2c142856e74e1c88b90c843c2e996"
    },
    "compilationPending": true
  },
  "version": "FakeTSVersion",
  "size": 223
}



Edit [0]:: no change

tsgo --formatOnly -p .
ExitStatus:: Success
Output::



Edit [1]:: change an implicitly imported file
//// [/home/src/workspaces/project/hidden/helper.ts] *modified* 
export const value=2;


tsgo --formatOnly -p .
ExitStatus:: Success
Output::
//// [/home/src/workspaces/project/hidden/helper.ts] *modified* 
export const value = 2;

//// [/home/src/workspaces/project/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"input.ts":"f8427906cba5adbc5fa8fbef004eb426","hidden/helper.ts":"e491aa8ff04ebae9527b600e75da559e"},"compilationPending":true},"version":"FakeTSVersion"}
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "input.ts": "f8427906cba5adbc5fa8fbef004eb426",
      "hidden/helper.ts": "e491aa8ff04ebae9527b600e75da559e"
    },
    "compilationPending": true
  },
  "version": "FakeTSVersion",
  "size": 223
}



Edit [2]:: compile after formatting an implicit input

tsgo -p .
ExitStatus:: Success
Output::
//// [/home/src/workspaces/project/hidden/helper.js] *new* 
export const value = 2;

//// [/home/src/workspaces/project/input.js] *new* 
import { value } from './hidden/helper';
export const result = value;

//// [/home/src/workspaces/project/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"input.ts":"f8427906cba5adbc5fa8fbef004eb426","hidden/helper.ts":"e491aa8ff04ebae9527b600e75da559e"}},"version":"FakeTSVersion","root":[3],"fileNames":["lib.es2026.full.d.ts","./hidden/helper.ts","./input.ts"],"fileInfos":[{"version":"8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true,"impliedNodeFormat":1},"69b982ec51fd4b789f475d26a882d2dc-export const value = 2;\n","54bd9036c4260328f5bc9da51e019dd9-import { value } from './hidden/helper';\nexport const result = value;\n"],"fileIdsList":[[2]],"referencedMap":[[3,1]]}
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "input.ts": "f8427906cba5adbc5fa8fbef004eb426",
      "hidden/helper.ts": "e491aa8ff04ebae9527b600e75da559e"
    }
  },
  "version": "FakeTSVersion",
  "root": [
    {
      "files": [
        "./input.ts"
      ],
      "original": 3
    }
  ],
  "fileNames": [
    "lib.es2026.full.d.ts",
    "./hidden/helper.ts",
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
      "fileName": "./hidden/helper.ts",
      "version": "69b982ec51fd4b789f475d26a882d2dc-export const value = 2;\n",
      "signature": "69b982ec51fd4b789f475d26a882d2dc-export const value = 2;\n",
      "impliedNodeFormat": "CommonJS"
    },
    {
      "fileName": "./input.ts",
      "version": "54bd9036c4260328f5bc9da51e019dd9-import { value } from './hidden/helper';\nexport const result = value;\n",
      "signature": "54bd9036c4260328f5bc9da51e019dd9-import { value } from './hidden/helper';\nexport const result = value;\n",
      "impliedNodeFormat": "CommonJS"
    }
  ],
  "fileIdsList": [
    [
      "./hidden/helper.ts"
    ]
  ],
  "referencedMap": {
    "./input.ts": [
      "./hidden/helper.ts"
    ]
  },
  "size": 1276
}

tsconfig.json::
SemanticDiagnostics::
*refresh*    /home/src/tslibs/TS/Lib/lib.es2026.full.d.ts
*refresh*    /home/src/workspaces/project/hidden/helper.ts
*refresh*    /home/src/workspaces/project/input.ts
Signatures::


Edit [3]:: introduce another transitive input
//// [/home/src/workspaces/project/hidden/helper.ts] *modified* 
import {more} from './more';
export const value=more;

//// [/home/src/workspaces/project/hidden/more.ts] *new* 
export const more=3;


tsgo --formatOnly -p .
ExitStatus:: Success
Output::
//// [/home/src/workspaces/project/hidden/helper.ts] *modified* 
import { more } from './more';
export const value = more;

//// [/home/src/workspaces/project/hidden/more.ts] *modified* 
export const more = 3;

//// [/home/src/workspaces/project/tsconfig.tsbuildinfo] *modified* 
{"formatting":{"options":"f3a9cf35267eb8d79f8caf91e90f8668","files":{"input.ts":"f8427906cba5adbc5fa8fbef004eb426","hidden/helper.ts":"b34d280cbb8b8e677761f5b005c9acbc","hidden/more.ts":"6b1bf5d15a112915bb820a42e870eff4"},"compilationPending":true},"version":"FakeTSVersion","root":[3],"fileNames":["lib.es2026.full.d.ts","./hidden/helper.ts","./input.ts"],"fileInfos":[{"version":"8859c12c614ce56ba9a18e58384a198f-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ninterface SymbolConstructor {\n    (desc?: string | number): symbol;\n    for(name: string): symbol;\n    readonly toStringTag: symbol;\n}\ndeclare var Symbol: SymbolConstructor;\ninterface Symbol {\n    readonly [Symbol.toStringTag]: string;\n}\ndeclare const console: { log(msg: any): void; };","affectsGlobalScope":true,"impliedNodeFormat":1},"69b982ec51fd4b789f475d26a882d2dc-export const value = 2;\n","54bd9036c4260328f5bc9da51e019dd9-import { value } from './hidden/helper';\nexport const result = value;\n"],"fileIdsList":[[2]],"referencedMap":[[3,1]]}
//// [/home/src/workspaces/project/tsconfig.tsbuildinfo.readable.baseline.txt] *modified* 
{
  "formatting": {
    "options": "f3a9cf35267eb8d79f8caf91e90f8668",
    "files": {
      "input.ts": "f8427906cba5adbc5fa8fbef004eb426",
      "hidden/helper.ts": "b34d280cbb8b8e677761f5b005c9acbc",
      "hidden/more.ts": "6b1bf5d15a112915bb820a42e870eff4"
    },
    "compilationPending": true
  },
  "version": "FakeTSVersion",
  "root": [
    {
      "files": [
        "./input.ts"
      ],
      "original": 3
    }
  ],
  "fileNames": [
    "lib.es2026.full.d.ts",
    "./hidden/helper.ts",
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
      "fileName": "./hidden/helper.ts",
      "version": "69b982ec51fd4b789f475d26a882d2dc-export const value = 2;\n",
      "signature": "69b982ec51fd4b789f475d26a882d2dc-export const value = 2;\n",
      "impliedNodeFormat": "CommonJS"
    },
    {
      "fileName": "./input.ts",
      "version": "54bd9036c4260328f5bc9da51e019dd9-import { value } from './hidden/helper';\nexport const result = value;\n",
      "signature": "54bd9036c4260328f5bc9da51e019dd9-import { value } from './hidden/helper';\nexport const result = value;\n",
      "impliedNodeFormat": "CommonJS"
    }
  ],
  "fileIdsList": [
    [
      "./hidden/helper.ts"
    ]
  ],
  "referencedMap": {
    "./input.ts": [
      "./hidden/helper.ts"
    ]
  },
  "size": 1354
}



Edit [4]:: no change

tsgo --formatOnly -p .
ExitStatus:: Success
Output::

