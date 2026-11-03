currentDirectory::/home/src/workspaces/project
useCaseSensitiveFileNames::true
Input::
//// [/home/src/workspaces/project/input.ts] *new* 
export function value(input:number){
return input+1;
}


tsgo --format --sourceMap input.ts
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
//// [/home/src/workspaces/project/input.js] *new* 
export function value(input) {
    return input + 1;
}
//# sourceMappingURL=input.js.map
//// [/home/src/workspaces/project/input.js.map] *new* 
{"version":3,"file":"input.js","sources":["input.ts"],"names":[],"mappings":"AAAA,MAAM,UAAU,KAAK,CAAC,KAAa;IAC/B,OAAO,KAAK,GAAG,CAAC,CAAC;AACrB,CAAC"}
//// [/home/src/workspaces/project/input.ts] *modified* 
export function value(input: number) {
    return input + 1;
}




Edit [0]:: no change

tsgo --format --sourceMap input.ts
ExitStatus:: Success
Output::
//// [/home/src/workspaces/project/input.js] *rewrite with same content*
//// [/home/src/workspaces/project/input.js.map] *rewrite with same content*

