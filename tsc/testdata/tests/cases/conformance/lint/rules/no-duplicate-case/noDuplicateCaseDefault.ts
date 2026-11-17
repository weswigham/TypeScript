// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-duplicate-case": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
declare const value: any, object: any, call: any;
switch (value) {
    case 1: break;
    case 1: break;
    case 1: break;
    case 0x1: break;
    case "text": break;
    case 'text': break;
    case "text": break;
    case (value): break;
    case value: break;
    case object.property: break;
    case object /* preserve */ . property: break;
    case call(value + 1).property: break;
    case call(value+1) .property: break;
    case call((value + 1)).property: break;
    case /pattern/g: break;
    case /pattern/g: break;
    case `value${value}`: break;
    case `value${value}`: break;
    default: break;
}
switch (value) { case value: break; }
switch (value) { case value: break; }
switch (value) {
    case 1: switch (value) { case 1: break; }
}