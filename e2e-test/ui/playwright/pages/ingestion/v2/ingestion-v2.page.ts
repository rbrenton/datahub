import { Page } from '@playwright/test';
import { SourcesV2Tab } from './tabs/sources-v2.tab';
import type { DataHubLogger } from '../../../utils/logger';
import { BasePage } from '@pages/base.page';
import { SecretsV2Tab } from './tabs/secrets-v2.tab';
import { RunHistoryV2Tab } from './tabs/run-history-v2.tab';

export {
  type SnowflakeSourceDetails,
  type ScheduleOptions,
  type CreateIngestionSourceOptions,
  type SnowflakeIngestionSourceOptions,
} from '../base/tabs/sources-base.tab';

export const INGESTION_TAB = {
  Sources: 'Sources',
  RunHistory: 'RunHistory',
  Secrets: 'Secrets',
} as const;

export type IngestionTab = (typeof INGESTION_TAB)[keyof typeof INGESTION_TAB];
export class IngestionV2Page extends BasePage {
  readonly sourcesTab: SourcesV2Tab;
  readonly runHistoryTab: RunHistoryV2Tab;
  readonly secretsTab: SecretsV2Tab;

  constructor(page: Page, logger?: DataHubLogger, logDir?: string) {
    super(page, logger, logDir);
    this.sourcesTab = new SourcesV2Tab(page, logger, logDir);
    this.runHistoryTab = new RunHistoryV2Tab(page, logger, logDir);
    this.secretsTab = new SecretsV2Tab(page, logger, logDir);
  }

  async goto(): Promise<void> {
    this.logger?.step('navigate to ingestion page');
    await this.navigate('/ingestion');
    await this.waitForPageLoad();
  }
}
