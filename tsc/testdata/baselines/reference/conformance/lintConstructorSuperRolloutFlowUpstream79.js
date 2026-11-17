//// [tests/cases/conformance/lint/rules/constructor-super/lintConstructorSuperRolloutFlowUpstream79.ts] ////

//// [input.ts]
class C extends D {

                constructor() {
                    for (let i = 1;;i++) {
                        if (bar) {
                            break;
                        }
                    }
                }

            }

//// [input.ts]
class C extends D {

                constructor() {
                    for (let i = 1;;i++) {
                        if (bar) {
                            break;
                        }
                    }
                }

            }
