import { type Locator, type Page, expect } from '@playwright/test';
import type { DataHubLogger } from '../../../../utils/logger';
import { BaseTab } from './base.tab';

export class SecretsBaseTab extends BaseTab {
  readonly name: string;
  readonly path: string;
  readonly tabKey: string;

  readonly createSecretButton: Locator;
  readonly secretNameInput: Locator;
  readonly secretValueInput: Locator;
  readonly secretDescriptionInput: Locator;
  readonly secretModalCreateButton: Locator;
  private readonly modalConfirmButton: Locator;

  constructor(
    protected readonly page: Page,
    protected readonly logger?: DataHubLogger,
    protected readonly logDir?: string,
  ) {
    super(page, logger, logDir);

    this.name = 'Secrets';
    this.path = '/ingestion/secrets';
    this.tabKey = 'Secrets';

    this.createSecretButton = page.locator('[data-testid="create-secret-button"]');
    this.secretNameInput = page.locator('[data-testid="secret-modal-name-input"] input');
    this.secretValueInput = page.locator('[data-testid="secret-modal-value-input"]').getByRole('textbox');
    this.secretDescriptionInput = page.locator('[data-testid="secret-modal-description-input"]').getByRole('textbox');
    this.secretModalCreateButton = page.locator('[data-testid="secret-modal-create-button"]');
    this.modalConfirmButton = page.locator('[data-testid="modal-confirm-button"]').filter({ visible: true });
  }

  async createSecret(name: string, value: string, description?: string): Promise<void> {
    this.logger?.step('create secret', { name });
    await this.createSecretButton.click();
    await this.secretNameInput.waitFor({ state: 'visible' });
    await this.secretNameInput.fill(name);
    await this.secretValueInput.fill(value);
    if (description) {
      await this.secretDescriptionInput.fill(description);
    }
    await this.secretModalCreateButton.click();
    await this.page.getByText('Successfully created Secret!').waitFor({ state: 'visible', timeout: 10000 });
  }

  async deleteSecret(name: string): Promise<void> {
    this.logger?.step('delete secret', { name });
    const row = this.page.locator('tr').filter({ hasText: name });
    await row.locator('[data-test-id="delete-secret-action"]').click();
    await this.page.getByText('Confirm Secret Removal').waitFor({ state: 'visible' });
    await this.modalConfirmButton.click();
    await this.page.getByText('Removed secret.').waitFor({ state: 'visible', timeout: 10000 });
  }

  async expectSecretVisible(name: string): Promise<void> {
    await expect(this.page.getByText(name)).toBeVisible({ timeout: 10000 });
  }

  async expectSecretNotVisible(name: string): Promise<void> {
    await expect(this.page.getByText(name)).toBeHidden();
  }
}
