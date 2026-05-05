import { type Locator, type Page, expect } from '@playwright/test';
import { GraphQLHelper } from '../../../../helpers/graphql-helper';
import type { DataHubLogger } from '../../../../utils/logger';
import { BaseTab } from './base.tab';

export interface SnowflakeSourceDetails {
  account_id: string;
  warehouse_id: string;
  username: string;
  password?: string;
  passwordSecret?: string;
  private_key?: string;
  role: string;
  authentication_type: 'Username & Password' | 'Private Key';
}

export interface ScheduleOptions {
  enabled: boolean;
  hour: string;
}

export type SourceFormFiller = (page: Page) => Promise<void>;

export interface CreateIngestionSourceOptions {
  sourceType: string;
  fillForm?: SourceFormFiller;
  schedule?: ScheduleOptions;
  shouldRun?: boolean;
  cliVersion?: string;
}

export interface UpdateIngestionSourceOptions {
  sourceName?: string;
  fillForm?: SourceFormFiller;
  schedule?: ScheduleOptions;
}

export interface SnowflakeIngestionSourceOptions {
  sourceDetails?: SnowflakeSourceDetails;
  schedule?: ScheduleOptions;
  shouldRun?: boolean;
  verifyYaml?: boolean;
}

export interface SnowflakeIngestionSourceUpdateOptions extends SnowflakeIngestionSourceOptions {
  sourceName?: string;
}

export const DEFAULT_SOURCE_DETAILS: SnowflakeSourceDetails = {
  account_id: 'test_account',
  warehouse_id: 'test_warehouse',
  username: 'test_user',
  password: 'test_password',
  role: 'test_role',
  authentication_type: 'Username & Password',
};

export abstract class SourcesBaseTab extends BaseTab {
  readonly name: string;
  readonly path: string;
  readonly tabKey: string;

  readonly createSourceButton: Locator;
  readonly sourcesSearchInput: Locator;
  readonly typeFilterSelect: Locator;
  readonly cliPill: Locator;
  readonly sourceTypeSearchInput: Locator;
  readonly passwordInput: Locator;
  readonly cronHoursSelect: Locator;
  protected readonly modalConfirmButton: Locator;
  abstract readonly sourceNameInput: Locator;
  abstract readonly saveButton: Locator;
  abstract readonly saveAndRunButton: Locator;
  abstract readonly cliVersionInput: Locator;

  protected readonly graphql: GraphQLHelper;

  constructor(
    protected readonly page: Page,
    protected readonly logger?: DataHubLogger,
    protected readonly logDir?: string,
  ) {
    super(page, logger, logDir);

    this.name = 'Sources';
    this.path = '/ingestion/sources';
    this.tabKey = 'Sources';

    this.graphql = new GraphQLHelper(page);

    this.createSourceButton = page.locator('[data-testid="create-ingestion-source-button"]');
    this.sourcesSearchInput = page.locator('[data-testid="ingestion-sources-search"]');
    this.typeFilterSelect = page.locator('[data-testid="ingestions-type-filter"]');
    this.cliPill = page.locator('[data-testid="ingestion-source-cli-pill"]');
    this.sourceTypeSearchInput = page.locator('[data-testid="source-type-search-input"]');
    this.passwordInput = page.locator('#password');
    this.cronHoursSelect = page.locator('.cron-builder-hours .ant-select');
    this.modalConfirmButton = page.locator('[data-testid="modal-confirm-button"]').filter({ visible: true });
  }

  async open(): Promise<void> {
    this.logger?.step('open sources tab');
    await this.page.goto('/ingestion/sources');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle');
  }

  async fillTextField(locator: Locator, value: string): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
    await locator.clear();
    await locator.fill(value);
  }

  getSourceRow(sourceName: string): Locator {
    return this.page.locator(`[data-testid="row-${sourceName}"]`).first();
  }

  getSourceCell(sourceName: string): Locator {
    return this.page.locator('td').filter({ hasText: sourceName }).first();
  }

  async clickRunButton(sourceName: string): Promise<void> {
    this.logger?.step('click run button', { sourceName });
    const row = this.getSourceRow(sourceName);
    await row.locator('[data-testid="run-ingestion-source-button"]').click({ force: true });
  }

  async confirmExecution(): Promise<void> {
    this.logger?.step('confirm execution dialog');
    await this.page.getByText('Confirm Source Execution').waitFor({ state: 'visible' });
    await this.modalConfirmButton.click();
  }

  async openMoreOptions(sourceName: string): Promise<void> {
    this.logger?.step('open more options', { sourceName });
    const row = this.getSourceRow(sourceName);
    await row.locator('[data-testid="ingestion-more-options"]').click();
  }

  async clickDropdownItem(label: string): Promise<void> {
    await this.page.locator('body .ant-dropdown-menu').getByText(label).click();
  }

  async selectTypeFilter(value: string): Promise<void> {
    this.logger?.step('select type filter', { value });
    await this.typeFilterSelect.click();
    await this.page.locator('body .ant-dropdown').getByText(value).click();
  }

  async clickLastRunCell(sourceName: string): Promise<void> {
    this.logger?.step('click last run cell', { sourceName });
    const row = this.getSourceRow(sourceName);
    const lastRunCell = row.locator('[data-testid="ingestion-source-last-run"]');
    await lastRunCell.waitFor({ state: 'visible', timeout: 30000 });
    await lastRunCell.click();
  }

  async clearSearch(): Promise<void> {
    this.logger?.step('clear search');
    const inputValue = await this.sourcesSearchInput.inputValue();
    if (inputValue) {
      const responsePromise = this.graphql.waitForGraphQLResponse('listIngestionSources');
      await this.sourcesSearchInput.clear();
      await responsePromise;
    } else {
      await this.sourcesSearchInput.clear();
    }
  }

  async search(sourceName: string): Promise<void> {
    this.logger?.step('search', { sourceName });
    await expect(this.sourcesSearchInput).toBeVisible();
    const responsePromise = this.graphql.waitForGraphQLResponse('listIngestionSources');
    await this.sourcesSearchInput.fill(sourceName);
    await responsePromise;
  }

  async expectSchedule(sourceName: string, scheduleText: string): Promise<void> {
    const row = this.getSourceRow(sourceName);
    await expect(row.locator('[data-testid="schedule"]').first()).toContainText(scheduleText);
  }

  async selectSourceType(typeName: string): Promise<void> {
    this.logger?.step('select source type', { typeName });
    await this.sourceTypeSearchInput.fill(typeName);
    const option = this.page.locator('[data-testid^="source-option-"]').filter({ hasText: typeName }).first();
    await option.scrollIntoViewIfNeeded();
    await option.click();
  }

  abstract openCreateSourceModal(): Promise<void>;

  abstract setScheduleHour(hour: string): Promise<void>;

  abstract createIngestionSource(sourceName: string, options: CreateIngestionSourceOptions): Promise<void>;

  abstract updateIngestionSource(sourceName: string, options: UpdateIngestionSourceOptions): Promise<void>;

  async setSourceName(name: string): Promise<void> {
    this.logger?.step('set source name', { name });
    await this.sourceNameInput.clear();
    await this.sourceNameInput.fill(name);
  }

  async saveSource(options?: { shouldRun?: boolean }): Promise<void> {
    this.logger?.step('save source');
    const saveButton = options?.shouldRun ? this.saveAndRunButton : this.saveButton;
    await saveButton.scrollIntoViewIfNeeded();
    const mutationRequest = this.graphql.waitForGraphQLResponse('createIngestionSource');
    const refetchRequest = this.graphql.waitForGraphQLResponse('getIngestionSource');
    await saveButton.click();
    await mutationRequest;
    await refetchRequest;
  }

  async saveAndRunSource(): Promise<void> {
    this.logger?.step('save and run source');
    await this.saveAndRunButton.scrollIntoViewIfNeeded();
    await this.saveAndRunButton.click();
    await this.page.getByText('Successfully created ingestion source!').waitFor({ state: 'visible', timeout: 15000 });
  }

  async saveUpdatedSource(): Promise<void> {
    this.logger?.step('save updated source');
    await this.saveButton.click();
  }

  async createSecretInlineForPassword(name: string, value: string, description?: string): Promise<void> {
    this.logger?.step('create secret inline for password', { name });
    await this.passwordInput.click();
    await this.page.getByText('Create Secret').click();
    // Use the ARIA dialog role to scope locators — getByRole skips display:none elements,
    // avoiding strict-mode violations from hidden SecretBuilderModal instances left in DOM
    // by Ant Design's Modal (which keeps content mounted after close by default).
    const dialog = this.page.getByRole('dialog', { name: 'Create a new Secret' });
    await dialog.waitFor({ state: 'visible' });
    await dialog.locator('[data-testid="secret-modal-name-input"] input').fill(name);
    await dialog.locator('[data-testid="secret-modal-value-input"]').getByRole('textbox').fill(value);
    if (description) {
      await dialog.locator('[data-testid="secret-modal-description-input"]').getByRole('textbox').fill(description);
    }
    await dialog.locator('[data-testid="secret-modal-create-button"]').click();
    await this.page.getByText('Created secret!').waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Cancel any RUNNING or PENDING execution for sourceName before deleting it.
   * Without this, the executor continues processing runs after deletion,
   * consuming memory and potentially causing OOM crashes when many runs pile up.
   */
  protected async cancelRunningExecution(sourceName: string): Promise<void> {
    const listQuery = `
      query listIngestionSources($input: ListIngestionSourcesInput!) {
        listIngestionSources(input: $input) {
          ingestionSources {
            urn
            name
            executions(start: 0, count: 1) {
              executionRequests {
                urn
                result { status }
              }
            }
          }
        }
      }`;

    let resp: Record<string, unknown>;
    try {
      resp = await this.graphql.executeQuery(listQuery, {
        input: { start: 0, count: 100, query: sourceName },
      });
    } catch {
      return;
    }

    type IngestionSourcesResponse = {
      data?: {
        listIngestionSources?: {
          ingestionSources?: Array<{
            urn: string;
            name: string;
            executions?: {
              executionRequests?: Array<{
                urn: string;
                result?: { status?: string };
              }>;
            };
          }>;
        };
      };
    };

    const sources = (resp as IngestionSourcesResponse).data?.listIngestionSources?.ingestionSources ?? [];
    const source = sources.find((s) => s.name === sourceName);
    if (!source) return;

    const lastExec = source.executions?.executionRequests?.[0];
    if (!lastExec) return;

    const status = lastExec.result?.status;
    if (status && status !== 'RUNNING' && status !== 'PENDING') return;

    const cancelMutation = `
      mutation cancelIngestionExecutionRequest($input: CancelIngestionExecutionRequestInput!) {
        cancelIngestionExecutionRequest(input: $input)
      }`;

    try {
      await this.graphql.executeQuery(cancelMutation, {
        input: {
          ingestionSourceUrn: source.urn,
          executionRequestUrn: lastExec.urn,
        },
      });
    } catch {
      // Best effort — continue with delete even if cancel fails.
    }
  }

  async searchIfNotVisible(sourceName: string): Promise<void> {
    const isSourceVisible = await this.page.getByText(sourceName).isVisible();
    if (!isSourceVisible) {
      await this.clearSearch();
      await this.search(sourceName);
      await this.expectSourceVisible(sourceName);
    }
  }

  async deleteIngestionSource(sourceName: string): Promise<void> {
    this.logger?.step('delete ingestion source', { sourceName });
    await this.cancelRunningExecution(sourceName);
    await this.searchIfNotVisible(sourceName);
    await this.openMoreOptions(sourceName);
    await this.clickDropdownItem('Delete');
    await this.page.getByText('Confirm Ingestion Source Removal').waitFor({ state: 'visible' });
    await this.modalConfirmButton.click();
    await this.page.getByText('Removed ingestion source').waitFor({ state: 'visible', timeout: 15000 });
  }

  async runIngestionSource(sourceName: string): Promise<void> {
    this.logger?.step('run ingestion source', { sourceName });
    await this.search(sourceName);
    await this.expectSourceVisible(sourceName);
    await this.clickRunButton(sourceName);
    await this.confirmExecution();
  }

  async expectSourceVisible(sourceName: string): Promise<void> {
    await expect(this.page.getByText(sourceName)).toBeVisible();
  }

  async expectSourceNotVisible(sourceName: string): Promise<void> {
    await expect(this.page.getByText(sourceName)).toBeHidden();
  }

  async expectSourceStatusContains(sourceName: string, status: string): Promise<void> {
    const row = this.getSourceCell(sourceName).locator('..');
    await expect(row.getByText(status, { exact: false })).toBeVisible({ timeout: 100000 });
  }

  async expectCliPillVisible(): Promise<void> {
    await expect(this.cliPill).toBeVisible();
  }

  async expectCliPillNotVisible(): Promise<void> {
    await expect(this.cliPill).toBeHidden();
  }
}
