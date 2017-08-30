// @lib: es6
function MakeThingFactory() {
    return () => ({
        [[...arguments].join()]: "thing"
    });
}