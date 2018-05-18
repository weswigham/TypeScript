// @strictNullChecks: true

function test1(param?: { prop: string | number }) {
    if ((param && param.prop) === "foo") {
        return param.prop;
    }
}

function test2(param?: { prop: string | number }) {
    switch (param && param.prop) {
        case "foo": {
            return param.prop;
        }
    }
}
