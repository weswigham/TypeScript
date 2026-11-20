export default {
    rules: {
        debugger: {
            meta: { type: "problem", schema: [], fixable: "code" },
            create(context) {
                const services = context.sourceCode.parserServices;
                if (
                    !services.project || services.program !== services.project.program ||
                    !services.snapshot.getProjects().some(project => project.handle === services.project.handle)
                ) {
                    throw new Error("Editor lint must use the project and snapshot supplied by the compiler");
                }
                return {
                    DebuggerStatement(node) {
                        context.report({
                            node,
                            message: "Remove editor debugger",
                            fix: fixer => fixer.remove(node),
                        });
                    },
                };
            },
        },
    },
};
