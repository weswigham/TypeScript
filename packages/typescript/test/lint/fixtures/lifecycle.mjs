import { threadId } from "node:worker_threads";

export default {
    rules: {
        probe: {
            meta: { schema: [{ enum: ["normal", "sleep", "exit", "crash", "hang", "configuration"] }] },
            create(context) {
                return {
                    Program(node) {
                        switch (context.options[0]) {
                            case "exit":
                                process.exit(37);
                            case "crash":
                                queueMicrotask(() => {
                                    throw new Error("Lifecycle worker crash");
                                });
                                break;
                            case "hang":
                                for (;;) {
                                    /* Terminated by the native supervisor. */
                                }
                            case "sleep":
                                Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 80);
                                break;
                            case "configuration": {
                                const options = context.sourceCode.parserServices.program.getCompilerOptions();
                                context.report({ node, message: `strict=${options.strict}` });
                                options.strict = "mutated by plugin";
                                return;
                            }
                        }
                        context.report({ node, message: `worker=${threadId}` });
                    },
                };
            },
        },
    },
};
