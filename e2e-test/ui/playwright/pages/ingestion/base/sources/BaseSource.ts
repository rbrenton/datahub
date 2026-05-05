import { expect, type Locator, type Page } from '@playwright/test';
import type { DataHubLogger } from '../../../../utils/logger';

export class BaseSource {
  readonly recipeBuilderYamlButton: Locator;
  readonly toggleExpandButton: Locator;
  readonly yamlEditor: Locator;

  constructor(
    protected readonly page: Page,
    protected readonly logger?: DataHubLogger,
    protected readonly logDir?: string,
  ) {
    this.recipeBuilderYamlButton = page.locator('[data-testid="recipe-builder-yaml-button"]');
    this.toggleExpandButton = page.locator('[data-testid="toggle-expand-button"]');
    this.yamlEditor = page.locator('.monaco-scrollable-element').first();
  }

  async fillTextField(locator: Locator, value: string): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
    await locator.clear();
    await locator.fill(value);
  }

  async fillSecretFieldAsPlainValue(locator: Locator, value: string): Promise<void> {
    await this.fillTextField(locator, value);
  }

  async fillSecretFieldWithExistingSecret(locator: Locator, value: string): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
    await locator.fill(value);
    const dropdown = this.page.locator('.ant-select-dropdown').last();
    await dropdown.waitFor({ state: 'visible' });
    await dropdown.getByText(value, { exact: true }).click();
  }

  getYamlSwitcherButton(): Locator {
    return this.recipeBuilderYamlButton;
  }

  async expectYamlRecipe(values: string[]): Promise<void> {
    this.logger?.step('verify yaml recipe');
    const yamlSwitcherButton = this.getYamlSwitcherButton();
    const hasYamlButton = await yamlSwitcherButton.isVisible();
    if (hasYamlButton) {
      await yamlSwitcherButton.scrollIntoViewIfNeeded();
      await yamlSwitcherButton.click();
    }

    const isExpandButtonVisible = await this.toggleExpandButton.isVisible();
    if (isExpandButtonVisible) {
      await this.toggleExpandButton.click({ force: true });
    }

    await Promise.all(
      values.map(async (value) => {
        await expect(this.yamlEditor).toContainText(value);
      }),
    );
  }
}
