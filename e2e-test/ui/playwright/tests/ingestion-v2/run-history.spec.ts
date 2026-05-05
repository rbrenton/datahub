import { test, expect } from '../../fixtures/base-test';
import { IngestionV2Page } from '../../pages/ingestion/v2/ingestion-v2.page';

// Pre-seeded names from tests/ingestion-v2/fixtures/data.json
const RUN_HISTORY_SOURCE = 'playwright run history source';
const VIEW_SOURCE = 'playwright run history view source';
const FILTER_SOURCE_1 = 'playwright run history filter 1';
const FILTER_SOURCE_2 = 'playwright run history filter 2';

test.use({ featureName: 'ingestion-v2' });

test.describe('run history tab in manage data sources', () => {
  let ingestionPage: IngestionV2Page;

  test.beforeEach(async ({ page, apiMock, logger, logDir }) => {
    ingestionPage = new IngestionV2Page(page, logger, logDir);

    await apiMock.setFeatureFlags({
      showIngestionPageRedesign: true,
      ingestionOnboardingRedesignV1: false,
      showNavBarRedesign: true,
    });

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

    await ingestionPage.sourcesTab.runIngestionSource(VIEW_SOURCE);
    await ingestionPage.sourcesTab.expectSourceStatusContains(VIEW_SOURCE, 'Success');

    await ingestionPage.runHistoryTab.open();
    await ingestionPage.runHistoryTab.filterBySource(VIEW_SOURCE);

    await expect(
      ingestionPage.runHistoryTab.executionsTable
        .locator('[data-testid="ingestion-source-name"]')
        .filter({ hasText: VIEW_SOURCE })
        .first(),
    ).toBeVisible();
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
    ).toBeVisible();
    await expect(
      ingestionPage.runHistoryTab.executionsTable.locator('td').filter({ hasText: FILTER_SOURCE_2 }),
    ).toBeHidden();
  });
});
