//// [tests/cases/conformance/lint/rules/no-new-wrappers/noNewWrappersConstructors.ts] ////

//// [input.ts]
new String("value");
new Number(42);
new Boolean(false);
new (String)("value");
new Boolean;
String("value");
Number(42);
Boolean(false);
new Object();
new window.String("value");
String.fromCharCode(32);
function local(String, Number, Boolean) {
    new String();
    new Number();
    new Boolean();
}
{
    const String = Custom;
    new String();
}

//// [shadowed.ts]
export {};
if (condition) {
    new Boolean();
} else {
    var Boolean = Custom;
}

//// [imported.ts]
import String from "./custom";
new String();

//// [custom.ts]
export default class Custom {}

//// [custom.ts]
export default class Custom {}
//// [imported.ts]
import String from "./custom";
new String();
//// [input.ts]
new String("value");
new Number(42);
new Boolean(false);
new (String)("value");
new Boolean;
String("value");
Number(42);
Boolean(false);
new Object();
new window.String("value");
String.fromCharCode(32);
function local(String, Number, Boolean) {
    new String();
    new Number();
    new Boolean();
}
{
    const String = Custom;
    new String();
}
//// [shadowed.ts]
export {};
if (condition) {
    new Boolean();
} else {
    var Boolean = Custom;
}
