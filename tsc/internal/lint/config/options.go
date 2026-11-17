package config

import (
	_ "embed"
	"fmt"
	"maps"
	"math"
	"reflect"
	"slices"
	"strconv"
	"strings"
	"sync"
	"unicode/utf8"

	"github.com/microsoft/TypeScript/tsc/internal/json"
	"github.com/microsoft/TypeScript/tsc/internal/lint/regex"
)

//go:embed rule-options.generated.json
var ruleOptionsData []byte

var ruleOptions = sync.OnceValue(func() map[string]any {
	var data struct {
		Rules map[string]any `json:"rules"`
	}
	if err := json.Unmarshal(ruleOptionsData, &data); err != nil {
		panic(err)
	}
	return data.Rules
})

func ValidateRuleOptions(name string, options []any) error {
	schema, exists := ruleOptions()[name]
	if !exists {
		return fmt.Errorf("unknown lint rule %q", name)
	}
	return validate(schema, options, schema, "options")
}

func validate(schema, value, root any, path string) error {
	if allowed, ok := schema.(bool); ok {
		if !allowed {
			return fmt.Errorf("%s is not allowed", path)
		}
		return nil
	}
	object := schema.(map[string]any)
	if reference, ok := object["$ref"].(string); ok {
		resolved := root
		for part := range strings.SplitSeq(strings.TrimPrefix(reference, "#/"), "/") {
			part = strings.ReplaceAll(strings.ReplaceAll(part, "~1", "/"), "~0", "~")
			switch current := resolved.(type) {
			case map[string]any:
				resolved = current[part]
			case []any:
				index, err := strconv.Atoi(part)
				if err != nil || index < 0 || index >= len(current) {
					return fmt.Errorf("invalid schema reference %q", reference)
				}
				resolved = current[index]
			default:
				return fmt.Errorf("invalid schema reference %q", reference)
			}
		}
		if resolved == nil {
			return fmt.Errorf("invalid schema reference %q", reference)
		}
		if err := validate(resolved, value, root, path); err != nil {
			return err
		}
	}
	if expected, exists := object["type"]; exists && !matchesType(value, expected) {
		return fmt.Errorf("%s must be %v", path, expected)
	}
	if allowed, ok := object["enum"].([]any); ok && !slices.ContainsFunc(allowed, func(item any) bool { return reflect.DeepEqual(value, item) }) {
		return fmt.Errorf("%s must be one of %v", path, allowed)
	}
	if expected, exists := object["const"]; exists && !reflect.DeepEqual(value, expected) {
		return fmt.Errorf("%s must be %v", path, expected)
	}
	for _, keyword := range []string{"anyOf", "oneOf", "allOf"} {
		if alternatives, ok := object[keyword].([]any); ok {
			matches := 0
			for _, alternative := range alternatives {
				if validate(alternative, value, root, path) == nil {
					matches++
				}
			}
			if keyword == "anyOf" && matches == 0 || keyword == "oneOf" && matches != 1 || keyword == "allOf" && matches != len(alternatives) {
				return fmt.Errorf("%s does not match %s", path, keyword)
			}
		}
	}
	if disallowed, exists := object["not"]; exists && validate(disallowed, value, root, path) == nil {
		return fmt.Errorf("%s matches a disallowed value", path)
	}
	switch value := value.(type) {
	case map[string]any:
		if required, ok := object["required"].([]any); ok {
			for _, name := range required {
				if _, exists := value[name.(string)]; !exists {
					return fmt.Errorf("%s requires property %q", path, name)
				}
			}
		}
		properties, _ := object["properties"].(map[string]any)
		for _, name := range slices.Sorted(maps.Keys(value)) {
			item := value[name]
			property, known := properties[name]
			if !known {
				property, known = object["additionalProperties"]
			}
			if known {
				if err := validate(property, item, root, path+"."+name); err != nil {
					return err
				}
			}
		}
	case []any:
		if minimum, ok := object["minItems"].(float64); ok && len(value) < int(minimum) {
			return fmt.Errorf("%s must contain at least %v items", path, minimum)
		}
		if maximum, ok := object["maxItems"].(float64); ok && len(value) > int(maximum) {
			return fmt.Errorf("%s must contain at most %v items", path, maximum)
		}
		if object["uniqueItems"] == true {
			for index, item := range value {
				if slices.ContainsFunc(value[:index], func(previous any) bool { return reflect.DeepEqual(item, previous) }) {
					return fmt.Errorf("%s must contain unique items", path)
				}
			}
		}
		for index, item := range value {
			items, exists := object["items"]
			if tuple, ok := items.([]any); ok {
				if index < len(tuple) {
					items = tuple[index]
				} else {
					items, exists = object["additionalItems"]
				}
			}
			if exists {
				if err := validate(items, item, root, fmt.Sprintf("%s[%d]", path, index)); err != nil {
					return err
				}
			}
		}
	case string:
		if minimum, ok := object["minLength"].(float64); ok && utf8.RuneCountInString(value) < int(minimum) {
			return fmt.Errorf("%s must contain at least %v characters", path, minimum)
		}
		if pattern, ok := object["pattern"].(string); ok {
			compiled := regex.Compile(pattern)
			if !compiled.IsValid() {
				return fmt.Errorf("invalid schema pattern %q", pattern)
			}
			if !compiled.MatchString(value) {
				return fmt.Errorf("%s must match %q", path, pattern)
			}
		}
	case float64:
		if minimum, ok := object["minimum"].(float64); ok && value < minimum {
			return fmt.Errorf("%s must be at least %v", path, minimum)
		}
	}
	return nil
}

func matchesType(value, expected any) bool {
	if alternatives, ok := expected.([]any); ok {
		return slices.ContainsFunc(alternatives, func(item any) bool { return matchesType(value, item) })
	}
	switch expected {
	case "null":
		return value == nil
	case "boolean":
		_, ok := value.(bool)
		return ok
	case "string":
		_, ok := value.(string)
		return ok
	case "object":
		_, ok := value.(map[string]any)
		return ok
	case "array":
		_, ok := value.([]any)
		return ok
	case "number", "integer":
		number, ok := value.(float64)
		return ok && (expected == "number" || math.Trunc(number) == number)
	}
	panic(fmt.Sprintf("unknown schema type %v", expected))
}
