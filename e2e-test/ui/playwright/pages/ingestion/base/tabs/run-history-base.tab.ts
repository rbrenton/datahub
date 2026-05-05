import { type Locator, type Page, expect } from '@playwright/test';
import type { DataHubLogger } from '../../../../utils/logger';
import { BaseTab } from './base.tab';

export class RunHistoryBaseTab extends BaseTab {
  readonly name: string;
  readonly path: string;
  readonly tabKey: string;

  readonly executionsTable: Locator;
  readonly sourceNameFilter: Locator;
  readonly dropdownSearchBar: Locator;
  readonly footerUpdateButton: Locator;

  constructor(
    protected readonly page: Page,
    protected readonly logger?: DataHubLogger,
    protected readonly logDir?: string,
  ) {
    super(page, logger, logDir);

    this.name = 'RunHistory';
    this.path = '/ingestion/run-history';
    this.tabKey = 'RunHistory'

    this.executionsTable = page.locator('[data-testid="executions-table"]');
    this.sourceNameFilter = page.locator('[data-testid="source-name-filter"]');
    this.dropdownSearchBar = page.locator('[data-testid="dropdown-search-input"]');
    this.footerUpdateButton = page.locator('[data-testid="footer-button-update"]');
  }

  async filterBySource(sourceName: string): Promise<void> {
    this.logger?.step('filter by source', { sourceName });
    await this.sourceNameFilter.click();
    await this.dropdownSearchBar.fill(sourceName);
    await this.page.locator('body .ant-dropdown').getByText(sourceName).click();
    await this.footerUpdateButton.click();
  }

  async expectExecutionRowVisible(sourceName: string): Promise<void> {
    await expect(
      this.executionsTable.locator('[data-testid="ingestion-source-name"]').filter({ hasText: sourceName }),
    ).toBeVisible({ timeout: 30000 });
  }
}
