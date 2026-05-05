import { type Locator, type Page } from '@playwright/test';
import type { DataHubLogger } from '@utils/logger';
import { BaseSource } from '@pages/ingestion/base/sources/BaseSource';

export type SnowflakeFormDetails = {
  accountId?: string;
  warehouseId?: string;
  username?: string;
  password?: string;
  passwordSecret?: string;
  privateKey?: string;
  role?: string;
  authenticationType?: 'userNameAndPassword' | 'privateKey';
};

export class SnowflakeSource extends BaseSource {
  readonly accountIdInput: Locator;
  readonly warehouseInput: Locator;
  readonly usernameInput: Locator;
  readonly privateKeyInput: Locator;
  readonly authenticationTypeField: Locator;
  readonly passwordInput: Locator;
  readonly roleInput: Locator;

  constructor(page: Page, logger?: DataHubLogger, logDir?: string) {
    super(page, logger, logDir);
    this.accountIdInput = page.locator('#account_id');
    this.warehouseInput = page.locator('#warehouse');
    this.usernameInput = page.locator('#username');
    this.privateKeyInput = page.locator('#private_key');
    this.authenticationTypeField = page.locator('#authentication_type');
    this.passwordInput = page.locator('#password');
    this.roleInput = page.locator('#role');
  }

  async fillForm(details: Partial<SnowflakeFormDetails>): Promise<void> {
    this.logger?.step('fill snowflake details', { details });
    await this.waitForForm();

    await this.fillAccountId(details);
    await this.fillWarehouseId(details);
    await this.fillUsername(details);
    await this.fillAuthenticationType(details);

    if (details.authenticationType === 'privateKey') {
      await this.fillPrivateKey(details);
    } else {
      await this.fillPasswordSecret(details);
      await this.fillPassword(details);
    }

    await this.fillRole(details);
  }

  async waitForForm(): Promise<void> {
    await this.page.getByText('Snowflake Details').waitFor({ state: 'visible' });
  }

  async fillAccountId(details: SnowflakeFormDetails): Promise<void> {
    if (details.accountId) {
      await this.fillTextField(this.accountIdInput, details.accountId);
    }
  }

  async fillWarehouseId(details: SnowflakeFormDetails): Promise<void> {
    if (details.warehouseId) {
      await this.fillTextField(this.warehouseInput, details.warehouseId);
    }
  }

  async fillUsername(details: SnowflakeFormDetails): Promise<void> {
    if (details.username) {
      await this.fillTextField(this.usernameInput, details.username);
    }
  }

  async fillPrivateKey(details: SnowflakeFormDetails): Promise<void> {
    if (details.privateKey) {
      await this.fillTextField(this.privateKeyInput, details.privateKey);
    }
  }

  async fillAuthenticationType(details: SnowflakeFormDetails): Promise<void> {
    if (details.authenticationType) {
      await this.authenticationTypeField.scrollIntoViewIfNeeded();
      await this.authenticationTypeField.click({ force: true });
      const title = details.authenticationType === 'privateKey' ? 'Key' : 'Username & Password';
      await this.page.locator(`[title="${title}"]`).first().click({ force: true });
    }
  }

  async fillPasswordSecret(details: SnowflakeFormDetails): Promise<void> {
    if (details.passwordSecret) {
      await this.fillSecretFieldWithExistingSecret(this.passwordInput, details.passwordSecret);
    }
  }

  async fillPassword(details: SnowflakeFormDetails): Promise<void> {
    if (details.password) {
      await this.fillSecretFieldAsPlainValue(this.passwordInput, details.password);
    }
  }

  async fillRole(details: SnowflakeFormDetails): Promise<void> {
    if (details.role) {
      await this.fillSecretFieldAsPlainValue(this.roleInput, details.role);
    }
  }
}
