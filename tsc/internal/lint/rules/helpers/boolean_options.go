package helpers

func BooleanRuleOption(context Context, name string, fallback bool) bool {
	if len(context.Options) > 0 {
		if options, ok := context.Options[0].(map[string]any); ok {
			if value, ok := options[name].(bool); ok {
				return value
			}
		}
	}
	return fallback
}
