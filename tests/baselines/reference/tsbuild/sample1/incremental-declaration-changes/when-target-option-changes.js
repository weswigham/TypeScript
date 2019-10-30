//// [/lib/incremental-declaration-changesOutput.txt]
/lib/tsc --b /src/core --verbose
12:04:00 AM - Projects in this build: 
    * src/core/tsconfig.json

12:04:00 AM - Project 'src/core/tsconfig.json' is out of date because oldest output 'src/core/anotherModule.js' is older than newest input 'src/core/tsconfig.json'

12:04:00 AM - Building project '/src/core/tsconfig.json'...

TSFILE: /src/core/anotherModule.js
TSFILE: /src/core/index.js
TSFILE: /src/core/tsconfig.tsbuildinfo
/lib/lib.d.ts
/lib/lib.esnext.d.ts
/src/core/anotherModule.ts
/src/core/index.ts
/src/core/some_decl.d.ts
exitCode:: ExitStatus.Success


//// [/src/core/anotherModule.js]
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.World = "hello";


//// [/src/core/index.js]
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.someString = "HELLO WORLD";
function leftPad(s, n) { return s + n; }
exports.leftPad = leftPad;
function multiply(a, b) { return a * b; }
exports.multiply = multiply;


//// [/src/core/tsconfig.json]
{
    "compilerOptions": {
        "incremental": true,
"listFiles": true,
"listEmittedFiles": true,
        "target": "es5",
    }
}

//// [/src/core/tsconfig.tsbuildinfo]
{
  "program": {
    "fileInfos": {
      "../../lib/lib.d.ts": {
        "version": "8926001564-/// <reference no-default-lib=\"true\"/>\n/// <reference lib=\"esnext\" />",
        "signature": "8926001564-/// <reference no-default-lib=\"true\"/>\n/// <reference lib=\"esnext\" />"
      },
      "../../lib/lib.esnext.d.ts": {
        "version": "3858781397-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ndeclare const console: { log(msg: any): void; };",
        "signature": "3858781397-/// <reference no-default-lib=\"true\"/>\ninterface Boolean {}\ninterface Function {}\ninterface CallableFunction {}\ninterface NewableFunction {}\ninterface IArguments {}\ninterface Number { toExponential: any; }\ninterface Object {}\ninterface RegExp {}\ninterface String { charAt: any; }\ninterface Array<T> { length: number; [n: number]: T; }\ninterface ReadonlyArray<T> {}\ndeclare const console: { log(msg: any): void; };"
      },
      "./anothermodule.ts": {
        "version": "-2676574883-export const World = \"hello\";\r\n",
        "signature": "-8396256275-export declare const World = \"hello\";\r\n"
      },
      "./index.ts": {
        "version": "-18749805970-export const someString: string = \"HELLO WORLD\";\r\nexport function leftPad(s: string, n: number) { return s + n; }\r\nexport function multiply(a: number, b: number) { return a * b; }\r\n",
        "signature": "1874987148-export declare const someString: string;\r\nexport declare function leftPad(s: string, n: number): string;\r\nexport declare function multiply(a: number, b: number): number;\r\n"
      },
      "./some_decl.d.ts": {
        "version": "-9253692965-declare const dts: any;\r\n",
        "signature": "-9253692965-declare const dts: any;\r\n"
      }
    },
    "options": {
      "incremental": true,
      "listFiles": true,
      "listEmittedFiles": true,
      "target": 1,
      "configFilePath": "./tsconfig.json"
    },
    "referencedMap": {},
    "exportedModulesMap": {},
    "semanticDiagnosticsPerFile": [
      "../../lib/lib.d.ts",
      "../../lib/lib.esnext.d.ts",
      "./anothermodule.ts",
      "./index.ts",
      "./some_decl.d.ts"
    ]
  },
  "version": "FakeTSVersion"
}

