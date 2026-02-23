import type { IPipelineContext, IPipelineStage } from '../core/interfaces';
import { ClassLogService, type ClassLogServiceOutput } from '../services/class-log';

export class ClassLogStage implements IPipelineStage<unknown, ClassLogServiceOutput> {
  readonly name = 'class-log';
  readonly order = 3;
  readonly enabled = true;
  readonly dependencies: string[] = ['html'];
  readonly description = 'Generate class usage logs from generated views';

  private service: ClassLogService;

  constructor() {
    this.service = new ClassLogService();
  }

  canExecute(context: IPipelineContext): boolean {
    return !!context.config.classLog?.enabled;
  }

  async execute(_input: unknown, context: IPipelineContext): Promise<ClassLogServiceOutput> {
    const { config, logger, eventBus } = context;

    await this.service.initialize({ config, logger, eventBus, registry: context.registry });

    const classLogConfig = config.classLog ?? {};
    const result = await this.service.execute({
      viewsDir: config.html.viewsDir,
      outputDir: classLogConfig.outputDir ?? './dist/maps',
      baseName: classLogConfig.baseName ?? 'ui8kit',
      uikitMapPath: classLogConfig.uikitMapPath,
      includeResponsive: classLogConfig.includeResponsive ?? true,
      includeStates: classLogConfig.includeStates ?? true,
    });

    logger.info(`Class log: ${result.totalClasses} unique classes (${result.validClasses} valid)`);
    eventBus.emit('stage:complete', { name: this.name, result });
    return result;
  }
}

