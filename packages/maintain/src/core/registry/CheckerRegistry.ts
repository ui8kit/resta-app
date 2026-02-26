import type { IChecker } from '../interfaces';

export class CheckerRegistry {
  private readonly checkers = new Map<string, IChecker>();

  register(checker: IChecker): void {
    if (this.checkers.has(checker.name)) {
      throw new Error(`Checker "${checker.name}" is already registered.`);
    }
    this.checkers.set(checker.name, checker);
  }

  has(name: string): boolean {
    return this.checkers.has(name);
  }

  resolve<TChecker extends IChecker = IChecker>(name: string): TChecker {
    const checker = this.checkers.get(name);
    if (!checker) {
      throw new Error(`Checker "${name}" is not registered.`);
    }
    return checker as TChecker;
  }

  resolveMany(names: string[]): IChecker[] {
    return names.map((name) => this.resolve(name));
  }

  list(): IChecker[] {
    return Array.from(this.checkers.values());
  }
}
