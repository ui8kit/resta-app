import ts from 'typescript';

export type ExportSymbolKind =
  | 'interface'
  | 'function'
  | 'type'
  | 'class'
  | 'variable'
  | 'reexport'
  | 'export-assignment'
  | 'unknown';

export interface ParsedExportSymbol {
  kind: ExportSymbolKind;
  name?: string;
  line: number;
  column: number;
}

export interface ParsedImport {
  source: string;
  specifiers: string[];
  typeOnly: boolean;
  line: number;
  column: number;
}

export type JsxPropValue = string | number | boolean | null;

export interface ParsedJsxUsage {
  componentName: string;
  props: Record<string, JsxPropValue>;
  line: number;
  column: number;
}

export class TsxParser {
  parseExports(content: string, filePath = 'inline.tsx'): ParsedExportSymbol[] {
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );
    const symbols: ParsedExportSymbol[] = [];

    for (const statement of sourceFile.statements) {
      if (ts.isExportAssignment(statement)) {
        symbols.push(this.exportRecord(sourceFile, statement, 'export-assignment'));
        continue;
      }

      if (ts.isExportDeclaration(statement) && !statement.isTypeOnly) {
        if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
          for (const element of statement.exportClause.elements) {
            symbols.push(this.exportRecord(sourceFile, element, 'reexport', element.name.text));
          }
        } else {
          symbols.push(this.exportRecord(sourceFile, statement, 'reexport'));
        }
        continue;
      }

      if (!this.hasExportModifier(statement)) {
        continue;
      }

      if (ts.isInterfaceDeclaration(statement)) {
        symbols.push(this.exportRecord(sourceFile, statement, 'interface', statement.name.text));
        continue;
      }

      if (ts.isFunctionDeclaration(statement)) {
        symbols.push(this.exportRecord(sourceFile, statement, 'function', statement.name?.text));
        continue;
      }

      if (ts.isTypeAliasDeclaration(statement)) {
        symbols.push(this.exportRecord(sourceFile, statement, 'type', statement.name.text));
        continue;
      }

      if (ts.isClassDeclaration(statement)) {
        symbols.push(this.exportRecord(sourceFile, statement, 'class', statement.name?.text));
        continue;
      }

      if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations) {
          const name = ts.isIdentifier(declaration.name)
            ? declaration.name.text
            : declaration.name.getText(sourceFile);
          symbols.push(this.exportRecord(sourceFile, declaration, 'variable', name));
        }
        continue;
      }

      symbols.push(this.exportRecord(sourceFile, statement, 'unknown'));
    }

    return symbols;
  }

  parseImports(content: string, filePath = 'inline.tsx'): ParsedImport[] {
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );
    const imports: ParsedImport[] = [];

    for (const statement of sourceFile.statements) {
      if (!ts.isImportDeclaration(statement)) {
        continue;
      }

      const source = ts.isStringLiteral(statement.moduleSpecifier)
        ? statement.moduleSpecifier.text
        : statement.moduleSpecifier.getText(sourceFile).replace(/^['"]|['"]$/g, '');
      const specifiers: string[] = [];
      const clause = statement.importClause;
      const typeOnly =
        Boolean(clause?.isTypeOnly) ||
        Boolean(
          clause?.namedBindings &&
            ts.isNamedImports(clause.namedBindings) &&
            clause.namedBindings.elements.every((entry) => entry.isTypeOnly)
        );

      if (clause?.name) {
        specifiers.push(clause.name.text);
      }
      if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) {
        for (const element of clause.namedBindings.elements) {
          specifiers.push(element.name.text);
        }
      }
      if (clause?.namedBindings && ts.isNamespaceImport(clause.namedBindings)) {
        specifiers.push(clause.namedBindings.name.text);
      }

      const location = sourceFile.getLineAndCharacterOfPosition(statement.getStart(sourceFile));
      imports.push({
        source,
        specifiers,
        typeOnly,
        line: location.line + 1,
        column: location.character + 1,
      });
    }

    return imports;
  }

  parseJsxProps(
    content: string,
    componentName: string = '*',
    filePath = 'inline.tsx'
  ): ParsedJsxUsage[] {
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );
    const usages: ParsedJsxUsage[] = [];

    const shouldInclude = (name: string): boolean =>
      componentName === '*' || componentName === name;

    const handleOpening = (opening: ts.JsxOpeningLikeElement): void => {
      const name = this.getTagName(opening.tagName);
      if (!name || !shouldInclude(name)) {
        return;
      }

      const props: Record<string, JsxPropValue> = {};
      for (const attribute of opening.attributes.properties) {
        if (!ts.isJsxAttribute(attribute)) {
          continue;
        }
        const propName = attribute.name.text;
        const value = this.readJsxAttributeValue(attribute.initializer);
        if (value !== undefined) {
          props[propName] = value;
        }
      }

      const location = sourceFile.getLineAndCharacterOfPosition(opening.getStart(sourceFile));
      usages.push({
        componentName: name,
        props,
        line: location.line + 1,
        column: location.character + 1,
      });
    };

    const visit = (node: ts.Node): void => {
      if (ts.isJsxSelfClosingElement(node)) {
        handleOpening(node);
      } else if (ts.isJsxElement(node)) {
        handleOpening(node.openingElement);
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return usages;
  }

  private hasExportModifier(node: ts.Node): boolean {
    if (!ts.canHaveModifiers(node)) {
      return false;
    }
    const modifiers = ts.getModifiers(node);
    return Boolean(modifiers?.some((item) => item.kind === ts.SyntaxKind.ExportKeyword));
  }

  private exportRecord(
    sourceFile: ts.SourceFile,
    node: ts.Node,
    kind: ExportSymbolKind,
    name?: string
  ): ParsedExportSymbol {
    const location = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    return {
      kind,
      name,
      line: location.line + 1,
      column: location.character + 1,
    };
  }

  private getTagName(name: ts.JsxTagNameExpression): string | undefined {
    if (ts.isIdentifier(name)) {
      return name.text;
    }
    if (ts.isPropertyAccessExpression(name)) {
      return name.name.text;
    }
    if (ts.isThis(name)) {
      return 'this';
    }
    return undefined;
  }

  private readJsxAttributeValue(
    initializer: ts.JsxAttributeValue | undefined
  ): JsxPropValue | undefined {
    if (!initializer) {
      return true;
    }

    if (ts.isStringLiteral(initializer)) {
      return initializer.text;
    }

    if (!ts.isJsxExpression(initializer) || !initializer.expression) {
      return undefined;
    }

    const expr = initializer.expression;
    if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
      return expr.text;
    }
    if (ts.isNumericLiteral(expr)) {
      return Number(expr.text);
    }
    if (expr.kind === ts.SyntaxKind.TrueKeyword) {
      return true;
    }
    if (expr.kind === ts.SyntaxKind.FalseKeyword) {
      return false;
    }
    if (expr.kind === ts.SyntaxKind.NullKeyword) {
      return null;
    }
    if (
      ts.isPrefixUnaryExpression(expr) &&
      expr.operator === ts.SyntaxKind.MinusToken &&
      ts.isNumericLiteral(expr.operand)
    ) {
      return -Number(expr.operand.text);
    }

    return undefined;
  }
}
