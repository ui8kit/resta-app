export interface ClassConflict {
  utility: string;
  values: string[];
}

export class ClassMatcher {
  private static readonly COLOR_CLASS_PATTERN =
    /^(bg|text|border|ring|accent|caret|fill|stroke|from|to|via)-/;

  static extractColorClasses(classes: string[]): string[] {
    return classes.filter((className) =>
      ClassMatcher.COLOR_CLASS_PATTERN.test(ClassMatcher.normalizeUtility(className))
    );
  }

  static isTokenColor(className: string, whitelist: Iterable<string>): boolean {
    const normalized = ClassMatcher.normalizeUtility(className);
    const allow = new Set(Array.from(whitelist, (value) => value.toLowerCase()));

    if (allow.has(normalized.toLowerCase())) {
      return true;
    }

    const dashIndex = normalized.indexOf('-');
    if (dashIndex < 0) {
      return false;
    }

    const tokenValue = normalized.slice(dashIndex + 1).toLowerCase();
    return allow.has(tokenValue);
  }

  static detectConflicts(classSets: Iterable<Iterable<string>>): ClassConflict[] {
    const valuesByUtility = new Map<string, Set<string>>();

    for (const classSet of classSets) {
      for (const className of classSet) {
        const parsed = ClassMatcher.parseUtilityClass(className);
        if (!parsed) {
          continue;
        }

        const values = valuesByUtility.get(parsed.utility) ?? new Set<string>();
        values.add(parsed.value);
        valuesByUtility.set(parsed.utility, values);
      }
    }

    const conflicts: ClassConflict[] = [];
    for (const [utility, values] of valuesByUtility.entries()) {
      if (values.size <= 1) {
        continue;
      }
      conflicts.push({
        utility,
        values: Array.from(values).sort(),
      });
    }

    return conflicts.sort((left, right) => left.utility.localeCompare(right.utility));
  }

  private static parseUtilityClass(
    className: string
  ): { utility: string; value: string } | undefined {
    const normalized = ClassMatcher.normalizeUtility(className);
    const parts = normalized.split('-').filter(Boolean);
    if (parts.length < 2) {
      return undefined;
    }

    const directional = new Set(['x', 'y', 't', 'r', 'b', 'l']);
    const utility =
      parts.length >= 3 && directional.has(parts[1] ?? '') ? `${parts[0]}-${parts[1]}` : parts[0];
    const valueStart = utility === parts[0] ? 1 : 2;
    const value = parts.slice(valueStart).join('-');

    if (!value) {
      return undefined;
    }

    return { utility, value };
  }

  private static normalizeUtility(className: string): string {
    const noImportant = className.startsWith('!') ? className.slice(1) : className;
    const segments = noImportant.split(':');
    const tail = segments[segments.length - 1] ?? noImportant;
    return tail.trim();
  }
}
