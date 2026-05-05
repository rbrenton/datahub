import { type Locator, type Page, expect } from '@playwright/test';
import {
  SourcesBaseTab,
  UpdateIngestionSourceOptions,
  type CreateIngestionSourceOptions,
} from '../../base/tabs/sources-base.tab';
import type { DataHubLogger } from '../../../../utils/logger';
import { SnowflakeSourceV3 } from '../sources/SnowflakeSourceV3';
import { CustomSource } from '@pages/ingestion/base/sources/CustomSource';

export class SourcesV3Tab extends SourcesBaseTab {
  readonly scheduleEnabledSwitch: Locator;
  readonly expandCollapseButton: Locator;
  readonly runDetailsSummaryTab: Locator;
  readonly runDetailsLogsTab: Locator;
  readonly runDetailsRecipeTab: Locator;
  readonly runDetailsPageHeader: Locator;
  readonly runDetailsStatusPill: Locator;
  readonly manageDataSourcesBreadcrumb: Locator;
  readonly sourceNameInput: Locator;
  readonly saveButton: Locator;
  readonly saveAndRunButton: Locator;
  readonly cliVersionInput: Locator;

  readonly customSource: CustomSource;
  readonly snowflakeSource: SnowflakeSourceV3;

  constructor(
    protected readonly page: Page,
    protected readonly logger?: DataHubLogger,
    protected readonly logDir?: string,
  ) {
    super(page, logger, logDir);

    this.scheduleEnabledSwitch = page.locator('[data-testid="schedule-enabled-switch"]');
    this.expandCollapseButton = page.locator('[data-testid="expand-collapse-button"]');

    this.runDetailsSummaryTab = page.locator('[data-testid="run-details-summary-tab"]');
    this.runDetailsLogsTab = page.locator('[data-testid="run-details-logs-tab"]');
    this.runDetailsRecipeTab = page.locator('[data-testid="run-details-recipe-tab"]');
    this.runDetailsPageHeader = page.locator('[data-testid="page-title"]');
    this.runDetailsStatusPill = page.locator('[data-testid="run-details-status-pill"]');
    this.manageDataSourcesBreadcrumb = page.locator('[data-testid="breadcrumb-back"]');

    this.sourceNameInput = page.locator('[data-testid="data-source-name"]');
    this.saveButton = page.locator('[data-testid="save-button"]');
    this.saveAndRunButton = page.locator('[data-testid="save-and-run-button"]');
    this.cliVersionInput = page.locator('[data-testid="cli-version-input"] input');
    this.snowflakeSource = new SnowflakeSourceV3(page, logger);
    this.customSource = new CustomSource(page, logger);
  }

  async openCreateSourceModal(): Promise<void> {
    this.logger?.step('open create source modal');
    await this.createSourceButton.click();
    await this.sourceTypeSearchInput.waitFor({ state: 'visible', timeout: 10000 });
  }

  async setScheduleHour(hour: string): Promise<void> {
    this.logger?.step('set schedule hour', { hour });
    await this.page
      .locator('.cron-builder-hours')
      .locator('.ant-select-clear')
      .click()
      .catch(() => {});
    await this.cronHoursSelect.click();
    // Wait for the dropdown to open and the option to be visible before clicking.
    const option = this.page.locator(`[title="${hour}"]`).filter({ visible: true }).first();
    await option.waitFor({ state: 'visible' });
    await option.click();
    await expect(this.cronHoursSelect).toContainText(hour);
  }

  async enableSchedule(): Promise<void> {
    this.logger?.step('enable schedule toggle');
    const isScheduleEnabled = await this.scheduleEnabledSwitch.isChecked();
    if (!isScheduleEnabled) {
      await this.scheduleEnabledSwitch.click();
    }
  }

  async disableSchedule(): Promise<void> {
    this.logger?.step('disable schedule toggle');
    const isScheduleEnabled = await this.scheduleEnabledSwitch.isChecked();
    if (isScheduleEnabled) {
      await this.scheduleEnabledSwitch.click();
    }
  }

  async createIngestionSource(sourceName: string, options: CreateIngestionSourceOptions): Promise<void> {
    this.logger?.step('create ingestion source', { sourceName });
    const { sourceType, fillForm, schedule, shouldRun = false, cliVersion } = options;

    await this.openCreateSourceModal();

    await this.selectSourceType(sourceType);

    if (fillForm) {
      await fillForm(this.page);
    }

    await this.setSourceName(sourceName);

    await this.page.getByText('Sync Schedule').scrollIntoViewIfNeeded();
    if (schedule) {
      if (schedule.enabled) {
        await this.enableSchedule();
      } else {
        await this.disableSchedule();
      }
      await this.setScheduleHour(schedule.hour);
    }

    if (cliVersion) {
      await this.expandCollapseButton.click();
      await this.cliVersionInput.fill(cliVersion);
    }

    if (shouldRun) {
      await this.saveAndRunButton.scrollIntoViewIfNeeded();
      await this.saveAndRunButton.click();
      await this.page.getByText(sourceName).waitFor({ state: 'visible', timeout: 15000 });
      const sourceCell = this.getSourceCell(sourceName);
      await sourceCell
        .locator('..')
        .getByText('Success', { exact: false })
        .waitFor({ state: 'visible', timeout: 100000 });
    } else {
      await this.saveSource();
      await this.graphql.waitForGraphQLResponse('getIngestionSource');
    }
  }

  async updateIngestionSource(sourceName: string, options: UpdateIngestionSourceOptions): Promise<void> {
    this.logger?.step('update ingestion source', { sourceName });

    const { sourceName: newSourceName, fillForm, schedule } = options;

    await this.searchIfNotVisible(sourceName);
    await this.openMoreOptions(sourceName);
    await this.clickDropdownItem('Edit');

    if (newSourceName) {
      await this.sourceNameInput.focus();
      await this.sourceNameInput.fill(newSourceName);
    }

    await this.page.getByText('Sync Schedule').scrollIntoViewIfNeeded();
    if (schedule) {
      if (schedule.enabled) {
        await this.enableSchedule();
      } else {
        await this.disableSchedule();
      }
      await this.setScheduleHour(schedule.hour);
    }

    if (fillForm) {
      await fillForm(this.page);
    }

    const responsePromise = this.graphql.waitForGraphQLResponse('getIngestionSource');
    await this.saveUpdatedSource();
    await responsePromise;
  }

  async clickRunDetails(sourceName: string): Promise<void> {
    this.logger?.step('click run details', { sourceName });
    const row = this.getSourceRow(sourceName);
    await row.locator('[data-testid="ingestion-source-table-status"]').click();
  }

  async expectRunDetailsPageVisible(): Promise<void> {
    await expect(this.runDetailsPageHeader).toBeVisible();
    await expect(this.runDetailsSummaryTab).toBeVisible();
    await expect(this.runDetailsLogsTab).toBeVisible();
    await expect(this.runDetailsRecipeTab).toBeVisible();
  }

  async expectRunSuccessVisible(): Promise<void> {
    await expect(this.runDetailsStatusPill).toContainText('Success');
  }

  async navigateBackToIngestion(): Promise<void> {
    this.logger?.step('navigate back to ingestion via breadcrumb');
    await this.manageDataSourcesBreadcrumb.click();
  }
}
