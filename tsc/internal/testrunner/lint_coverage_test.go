package testrunner

import (
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/lint/rules"
	"github.com/microsoft/TypeScript/tsc/internal/repo"
)

func TestLintCompilerFixtureCoverage(t *testing.T) {
	t.Parallel()
	root := filepath.Join(repo.TestDataPath(), "tests", "cases", "conformance", "lint", "rules")
	covered := make(map[string]bool)
	err := filepath.WalkDir(root, func(path string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".ts") {
			return nil
		}
		content, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		settings := extractCompilerSettings(string(content))
		if settings["lintonly"] != "true" || settings["fix"] != "true" {
			return nil
		}
		payload := makeUnitsFromTest(string(content), path)
		if payload.tsConfig == nil {
			return nil
		}
		for name, severity := range payload.tsConfig.LintRules() {
			if severity != "off" {
				covered[name] = true
			}
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
	for name := range rules.Factories {
		if !covered[name] {
			t.Errorf("lint rule %q has no enabled compiler fixture with @lintOnly and @fix", name)
		}
	}
}
