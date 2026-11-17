// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-alert": "error" } },
    "files": ["input.ts", "module.ts"]
}

// @filename: input.ts
alert("message");
confirm("message");
prompt("message");
(alert)("message");
alert?.("message");
window.alert("message");
window["confirm"]("message");
window[`prompt`]("message");
window["al\u0065rt"]("message");
window?.alert("message");
(window?.alert)("message");
globalThis.alert("message");
globalThis["confirm"]("message");
this.alert("message");
other.alert("message");
window[alert]("message");
window["al" + "ert"]("message");
new alert("message");
function shadowed(alert, confirm, prompt, window, globalThis) {
    alert();
    confirm();
    prompt();
    window.alert();
    globalThis.alert();
}
function localAlert(alert) {
    window.alert();
}
function hoisted() {
    alert();
    var alert = () => {};
}
function localThis() {
    this.alert();
}
{
    this.alert();
}
(() => this.alert())();
const methods = {
    [this.alert()]() {
        this.alert();
    },
    get [this.confirm()]() {
        return this.prompt();
    },
};

// @filename: module.ts
export {};
this.alert();
alert();