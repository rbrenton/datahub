import { expect, Page } from '@playwright/test';
import { DataHubLogger } from '@utils/logger';

export abstract class BaseTab {
  abstract readonly name: string;
  abstract readonly path: string;
  abstract readonly tabKey: string;

  constructor(
    protected readonly page: Page,
    protected readonly logger?: DataHubLogger,
    protected readonly logDir?: string,
  ) {}

  async navigate(): Promise<void> {
    this.logger?.step(`navigate to ${this.name} tab`);
    await this.page.goto(this.path);
    await this.waitForTabLoad();
  }

  async open(): Promise<void> {
    this.logger?.step(`open ${this.name} tab`);
    await this.page.locator(`div[data-node-key="${this.tabKey}"]`).click();
    await this.waitForTabLoad();
  }

  async expectTabActive(): Promise<void> {
    await expect(this.page.locator(`div[data-node-key="${this.tabKey}"]`)).toHaveClass(/ant-tabs-tab-active/);
  }

  async waitForTabLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle');
  }
}
