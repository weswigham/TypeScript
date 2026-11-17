//// [tests/cases/conformance/lint/rules/logical-assignment-operators/rolloutLogicalAssignmentOperators.ts] ////

//// [input.ts]
let value, fallback;
value = value || fallback;
object.value = object.value ?? fallback;
object.value || (object.value = fallback);
if (value == null) {
    value = fallback;
}
if (object.deep.value) object.deep.value = fallback;
value = value || /* keep */ fallback;

//// [input.ts]
let value, fallback;
value ||= fallback;
object.value = object.value ?? fallback;
object.value ||= fallback;
value ??= fallback;
if (object.deep.value) object.deep.value = fallback;
value = value || /* keep */ fallback;
