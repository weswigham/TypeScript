// @formatOnly: true
// @filename: tsconfig.json
{
    "files": ["main.ts"],
    "exclude": ["hidden", "node_modules"],
    "formattingOptions": { "indentSize": 2 }
}
// @filename: main.ts
import {value} from "./hidden/helper";
import type {Local} from "./types";
import type {Dependency} from "dep";
export const result:Local={value};
// @filename: hidden/helper.ts
export function calculate(){
return 1+2;
}
export const value=calculate();
// @filename: types.d.ts
export interface Local{value:number;}
// @filename: node_modules/dep/package.json
{ "name": "dep", "version": "1.0.0", "types": "index.d.ts" }
// @filename: node_modules/dep/index.d.ts
export interface Dependency{value:number;}
