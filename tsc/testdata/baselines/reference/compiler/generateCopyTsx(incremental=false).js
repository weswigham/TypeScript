//// [tests/cases/compiler/generateCopyTsx.tsx] ////

//// [component.tsx]
export function render(value:number){return <div>{value}</div>;}

//// [component.tsx]
export function render(value: number) { return <div>{value}</div>; }

//// [jsx.d.ts]
declare namespace JSX {
    interface Element { }
    interface IntrinsicElements { div: { children?: number }; }
}

//// [main.ts]
import { render } from "./generated/component";
export const view = render(42);

//// [component.jsx]
export function render(value) { return <div>{value}</div>; }
//# sourceMappingURL=component.jsx.map
//// [main.js]
import { render } from "./generated/component";
export const view = render(42);
//# sourceMappingURL=main.js.map

//// [component.d.ts]
export declare function render(value: number): JSX.Element;
//// [main.d.ts]
export declare const view: JSX.Element;
