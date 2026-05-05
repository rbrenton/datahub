import { test, expect } from '../../fixtures/base-test';
import { IngestionV3Page } from '../../pages/ingestion/v3/ingestion-v3.page';

const RUN_HISTORY_SOURCE = 'playwright v3 run history source';
const VIEW_SOURCE = 'playwright v3 run history view source';
const FILTER_SOURCE_1 = 'playwright v3 run history filter 1';
const FILTER_SOURCE_2 = 'playwright v3 run history filter 2';

test.use({ featureName: 'ingestion-v3' });

test.describe('run history tab in manage data sources', () => {
  let ingestionPage: IngestionV3Page;

  test.beforeEach(async ({ page, apiMock, logger, logDir }) => {
    ingestionPage = new IngestionV3Page(page, logger, logDir);

    await apiMock.setFeatureFlags({
      showIngestionPageRedesign: true,
      ingestionOnboardingRedesignV1: true,
      showNavBarRedesign: true,
    });

    await apiMock.suppressOnboardingModals();

    await ingestionPage.goto();
  });

  test('navigate to run history tab from last run column of sources tab', async () => {
    await ingestionPage.sourcesTab.search(RUN_HISTORY_SOURCE);
    await ingestionPage.sourcesTab.expectSourceVisible(RUN_HISTORY_SOURCE);

    await ingestionPage.sourcesTab.clickLastRunCell(RUN_HISTORY_SOURCE);

    await ingestionPage.runHistoryTab.expectTabActive();
  });

  test('navigate to run history tab from View run history option in dropdown of sources', async () => {
    await ingestionPage.sourcesTab.search(RUN_HISTORY_SOURCE);
    await ingestionPage.sourcesTab.expectSourceVisible(RUN_HISTORY_SOURCE);

    await ingestionPage.sourcesTab.openMoreOptions(RUN_HISTORY_SOURCE);
    await ingestionPage.sourcesTab.clickDropdownItem('View Run History');

    await ingestionPage.runHistoryTab.expectTabActive();
  });

  test('view past executions in run history tab', async () => {
    test.slow();

    // Run the dedicated fixture source to produce a fresh execution.
    await ingestionPage.sourcesTab.runIngestionSource(VIEW_SOURCE);
    await ingestionPage.sourcesTab.expectSourceStatusContains(VIEW_SOURCE, 'Success');

    // Switch to Run History and filter to this source so the new run is visible
    // regardless of how many other executions exist in the system.
    await ingestionPage.runHistoryTab.open();
    await ingestionPage.runHistoryTab.filterBySource(VIEW_SOURCE);

    await expect(
      ingestionPage.runHistoryTab.executionsTable
        .locator('[data-testid="ingestion-source-name"]')
        .filter({ hasText: VIEW_SOURCE })
        .first(),
    ).toBeVisible({ timeout: 15000 });
  });

  test('navigate to sources tab from source name in run history tab', async () => {
    await ingestionPage.runHistoryTab.open();
    await ingestionPage.runHistoryTab.filterBySource(RUN_HISTORY_SOURCE);

    await ingestionPage.runHistoryTab.executionsTable
      .locator('[data-testid="ingestion-source-name"]')
      .filter({ hasText: RUN_HISTORY_SOURCE })
      .first()
      .click({ force: true });

    await ingestionPage.sourcesTab.expectTabActive();
  });

  test('filter execution requests by source name', async () => {
    await ingestionPage.runHistoryTab.open();
    await ingestionPage.runHistoryTab.filterBySource(FILTER_SOURCE_1);

    await expect(
      ingestionPage.runHistoryTab.executionsTable.locator('td').filter({ hasText: FILTER_SOURCE_1 }),
    ).toBeVisible({ timeout: 15000 });
    await expect(
      ingestionPage.runHistoryTab.executionsTable.locator('td').filter({ hasText: FILTER_SOURCE_2 }),
    ).toBeHidden();
  });
});
