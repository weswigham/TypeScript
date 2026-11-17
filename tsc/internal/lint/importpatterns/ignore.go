package importpatterns

import (
	"regexp"
	"strings"
)

type (
	ignoreRule struct {
		negative  bool
		directory bool
		regex     *regexp.Regexp
	}
	Ignore struct{ rules []ignoreRule }
)

func Compile(patterns []string, caseSensitive bool) (*Ignore, error) {
	matcher := &Ignore{}
	for _, line := range patterns {
		for pattern := range strings.SplitSeq(line, "\n") {
			pattern = strings.TrimSuffix(pattern, "\r")
			for strings.HasSuffix(pattern, " ") {
				slashes := 0
				for index := len(pattern) - 2; index >= 0 && pattern[index] == '\\'; index-- {
					slashes++
				}
				if slashes%2 == 1 {
					break
				}
				pattern = pattern[:len(pattern)-1]
			}
			if pattern == "" || pattern[0] == '#' {
				continue
			}
			rule := ignoreRule{}
			if pattern[0] == '!' {
				rule.negative = true
				pattern = pattern[1:]
			}
			if pattern == "" {
				continue
			}
			rule.directory = strings.HasSuffix(pattern, "/")
			pattern = strings.TrimSuffix(pattern, "/")
			anchored := strings.HasPrefix(pattern, "/") || strings.Contains(pattern, "/")
			pattern = strings.TrimPrefix(pattern, "/")
			var source strings.Builder
			if !caseSensitive {
				source.WriteString("(?i)")
			}
			if anchored {
				source.WriteByte('^')
			} else {
				source.WriteString("(?:^|/)")
			}
			for index := 0; index < len(pattern); index++ {
				character := pattern[index]
				switch character {
				case '\\':
					if index+1 < len(pattern) {
						index++
						source.WriteString(regexp.QuoteMeta(pattern[index : index+1]))
					} else {
						source.WriteString(`\\`)
					}
				case '*':
					end := index
					for end+1 < len(pattern) && pattern[end+1] == '*' {
						end++
					}
					if end > index && (index == 0 || pattern[index-1] == '/') && (end+1 == len(pattern) || pattern[end+1] == '/') {
						if end+1 < len(pattern) {
							source.WriteString("(?:[^/]+/)*")
							index = end + 1
						} else {
							source.WriteString(".*")
							index = end
						}
					} else {
						source.WriteString("[^/]*")
						index = end
					}
				case '?':
					source.WriteString("[^/]")
				case '[':
					end := index + 1
					if end < len(pattern) && (pattern[end] == '!' || pattern[end] == '^') {
						end++
					}
					if end < len(pattern) && pattern[end] == ']' {
						end++
					}
					for end < len(pattern) && pattern[end] != ']' {
						end++
					}
					if end == len(pattern) {
						source.WriteString(`\[`)
						continue
					}
					class := pattern[index+1 : end]
					if strings.HasPrefix(class, "!") {
						class = "^" + class[1:]
					}
					source.WriteString("[" + class + "]")
					index = end
				default:
					source.WriteString(regexp.QuoteMeta(pattern[index : index+1]))
				}
			}
			source.WriteByte('$')
			compiled, err := regexp.Compile(source.String())
			if err != nil {
				return nil, err
			}
			rule.regex = compiled
			matcher.rules = append(matcher.rules, rule)
		}
	}
	return matcher, nil
}

func (matcher *Ignore) Match(path string) bool {
	for position := 0; position <= len(path); position++ {
		if position < len(path) && path[position] != '/' {
			continue
		}
		if position == 0 {
			continue
		}
		directory := position < len(path) || strings.HasSuffix(path, "/")
		prefix := path[:position]
		ignored := false
		for _, rule := range matcher.rules {
			if (!rule.directory || directory) && rule.regex.MatchString(prefix) {
				ignored = !rule.negative
			}
		}
		if ignored {
			return true
		}
	}
	return false
}
