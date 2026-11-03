// @formatOnly: true
// @allowJs: true
// @jsx: preserve
// @filename: input.js
function value(input){
return {value:input+1};
}
// @filename: component.tsx
export function Component(){
return <div value={1+2}>Hello</div>;
}
