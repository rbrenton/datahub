import { type Locator, type Page, expect } from '@playwright/test';
import {
  SourcesBaseTab,
  UpdateIngestionSourceOptions,
  type CreateIngestionSourceOptions,
} from '../../base/tabs/sources-base.tab';
import type { DataHubLogger } from '../../../../utils/logger';
import { SnowflakeSource } from '../../base/sources/SnowflakeSource';
import { CustomSource } from '@pages/ingestion/base/sources/CustomSource';

export class SourcesV2Tab extends SourcesBaseTab {
  readonly recipeBuilderNextButton: Locator;
  readonly recipeBuilderYamlButton: Locator;
  readonly scheduleNextButton: Locator;
  readonly sourceNameInput: Locator;
  readonly saveButton: Locator;
  readonly saveAndRunButton: Locator;
  readonly cliVersionInput: Locator;

  // Sources
  readonly customSource: CustomSource;
  readonly snowflakeSource: SnowflakeSource;

  constructor(
    protected readonly page: Page,
    protected readonly logger?: DataHubLogger,
    protected readonly logDir?: string,
  ) {
    super(page, logger, logDir);

    this.recipeBuilderNextButton = page.locator('[data-testid="recipe-builder-next-button"]');
    this.recipeBuilderYamlButton = page.locator('[data-testid="recipe-builder-yaml-button"]');
    this.scheduleNextButton = page.locator('[data-testid="ingestion-schedule-next-button"]');

    this.sourceNameInput = page.locator('[data-testid="source-name-input"]');
    this.saveButton = page.locator('[data-testid="ingestion-source-save-button"]');
    this.saveAndRunButton = page.locator('[data-testid="ingestion-source-save-and-run-button"]');
    this.cliVersionInput = page.locator('[data-testid="cli-version-input"]');

    this.customSource = new CustomSource(page, logger, logDir);
    this.snowflakeSource = new SnowflakeSource(page, logger, logDir);
  }

  async openCreateSourceModal(): Promise<void> {
    this.logger?.step('open create source modal');
    await this.createSourceButton.click();
    await this.sourceTypeSearchInput.waitFor({ state: 'visible', timeout: 10000 });
  }

  async clickNextButtonOnRecipeBuilderStep(): Promise<void> {
    this.logger?.step('click next button on recipe builder step');
    await this.recipeBuilderNextButton.scrollIntoViewIfNeeded();
    await this.recipeBuilderNextButton.click();
  }

  async clickNextButtonOnScheduleStep(): Promise<void> {
    this.logger?.step('click next button on schedule step');
    await this.scheduleNextButton.scrollIntoViewIfNeeded();
    await this.scheduleNextButton.click();
  }

  async setScheduleHour(hour: string): Promise<void> {
    this.logger?.step('set schedule hour', { hour });
    await this.cronHoursSelect.scrollIntoViewIfNeeded();
    // Clear any existing selection before opening the dropdown
    const clearButton = this.cronHoursSelect.locator('.ant-select-clear');
    if (await clearButton.count() > 0) {
      await clearButton.click();
    }
    await this.cronHoursSelect.click();
    await this.page.locator(`[title="${hour}"]`).filter({ visible: true }).click();
    await expect(this.cronHoursSelect).toContainText(hour);
  }

  async createIngestionSource(sourceName: string, options: CreateIngestionSourceOptions): Promise<void> {
    this.logger?.step('create ingestion source', { sourceName });
    const { sourceType, fillForm, schedule, shouldRun = false, cliVersion } = options;

    await this.openCreateSourceModal();

    await this.selectSourceType(sourceType);

    // Recipe builder step
    if (fillForm) {
      await fillForm(this.page);
    }
    await this.clickNextButtonOnRecipeBuilderStep();

    // Schedule step
    await this.page.getByText('Configure an Ingestion Schedule').waitFor({ state: 'visible' });
    if (schedule) {
      await this.setScheduleHour(schedule.hour);
    }
    await this.clickNextButtonOnScheduleStep();

    // Name and advanced settings step
    await this.page.getByText('Give this data source a name').waitFor({ state: 'visible' });
    await this.setSourceName(sourceName);
    if (cliVersion) {
      await this.page.getByText('Advanced').click();
      await this.cliVersionInput.fill(cliVersion);
    }

    // Save the source
    if (shouldRun) {
      await this.saveSource({ shouldRun: true });
    } else {
      await this.saveSource();
    }
  }

  async updateIngestionSource(sourceName: string, options: UpdateIngestionSourceOptions): Promise<void> {
    this.logger?.step('update ingestion source', { sourceName });

    const { sourceName: newSourceName, fillForm } = options;

    await this.expectSourceVisible(sourceName);
    await this.openMoreOptions(sourceName);
    await this.clickDropdownItem('Edit');
    await this.page.getByText('Edit Data Source').waitFor({ state: 'visible' });

    if (fillForm) {
      await fillForm(this.page);
    }

    await this.recipeBuilderNextButton.scrollIntoViewIfNeeded();
    await this.recipeBuilderNextButton.click();
    await this.page.getByText('Configure an Ingestion Schedule').waitFor({ state: 'visible' });

    if (options.schedule) {
      await this.setScheduleHour(options.schedule.hour);
    }

    await this.scheduleNextButton.click();
    if (newSourceName) {
      await this.setSourceName(newSourceName);
    }

    const responsePromise = this.graphql.waitForGraphQLResponse('getIngestionSource');
    await this.saveUpdatedSource();
    await responsePromise;
  }
}
