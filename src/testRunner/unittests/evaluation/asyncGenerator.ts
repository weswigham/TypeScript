import { evaluateTypeScript } from "../../evaluator";
import { ScriptTarget } from "../../ts";
describe("unittests:: evaluation:: asyncGeneratorEvaluation", () => {
    it("return (es5)", async () => {
        const result = evaluateTypeScript(`
        async function * g() {
            return Promise.resolve(0);
        }
        export const output: any[] = [];
        export async function main() {
            output.push(await g().next());
        }`);
        await result.main();
        assert.deepEqual(result.output, [
            { value: 0, done: true }
        ]);
    });
    it("return (es2015)", async () => {
        const result = evaluateTypeScript(`
        async function * g() {
            return Promise.resolve(0);
        }
        export const output: any[] = [];
        export async function main() {
            output.push(await g().next());
        }`, { target: ScriptTarget.ES2015 });
        await result.main();
        assert.deepEqual(result.output, [
            { value: 0, done: true }
        ]);
    });
});
