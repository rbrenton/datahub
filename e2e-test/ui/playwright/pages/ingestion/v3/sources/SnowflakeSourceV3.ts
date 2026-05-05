import { Page, Locator } from '@playwright/test';
import { SnowflakeFormDetails, SnowflakeSource } from '@pages/ingestion/base/sources/SnowflakeSource';
import { DataHubLogger } from '@utils/logger';

export class SnowflakeSourceV3 extends SnowflakeSource {
  readonly yamlSwitcherButton: Locator;

  constructor(page: Page, logger?: DataHubLogger, logDir?: string) {
    super(page, logger, logDir);
    this.yamlSwitcherButton = page.locator('[data-testid="yaml-editor-tab"]');
  }

  getYamlSwitcherButton(): Locator {
    return this.yamlSwitcherButton;
  }

  async waitForForm(): Promise<void> {
    await this.page.getByText('Snowflake Connection Details').waitFor({ state: 'visible' });
  }

  async fillAuthenticationType(details: SnowflakeFormDetails): Promise<void> {
    if (details.authenticationType) {
      // FYI: there is a bug when select is not in visible area it isn't added to DOM
      // so we scroll to element below and only then works with select
      await this.roleInput.scrollIntoViewIfNeeded();
      await this.usernameInput.scrollIntoViewIfNeeded();

      await this.authenticationTypeField.scrollIntoViewIfNeeded();
      await this.authenticationTypeField.click({ force: true });
      const optionDataTestId = `option-${details.authenticationType === 'privateKey' ? 'KEY_PAIR_AUTHENTICATOR' : 'DEFAULT_AUTHENTICATOR'}`;
      await this.page.locator(`[data-testid="${optionDataTestId}"]`).first().click({ force: true });
    }
  }
}
