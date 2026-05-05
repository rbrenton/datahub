import { SnowflakeFormDetails } from '@pages/ingestion/base/sources/SnowflakeSource';
import { test } from '../../fixtures/base-test';
import { IngestionV2Page } from '../../pages/ingestion/v2/ingestion-v2.page';
import crypto from 'crypto';

const FIXTURE_SECRET_NAME = 'playwright-ingestion-secret';

function randomSuffix() {
  return crypto.randomBytes(4).toString('hex');
}

test.use({ featureName: 'ingestion-v2' });

test.describe('secrets tab in manage data sources', () => {
  let ingestionPage: IngestionV2Page;

  test.beforeEach(async ({ page, apiMock, logger, logDir }) => {
    ingestionPage = new IngestionV2Page(page, logger, logDir);

    await apiMock.setFeatureFlags({
      showIngestionPageRedesign: true,
      ingestionOnboardingRedesignV1: false,
      showNavBarRedesign: true,
    });

    await ingestionPage.secretsTab.navigate();
  });

  test('create and delete a secret', async () => {
    const suffix = randomSuffix();
    const secretName = `playwright_secret_${suffix}`;
    const secretValue = `secret-value-${suffix}`;
    const secretDescription = `playwright test secret description ${suffix}`;

    await ingestionPage.secretsTab.createSecret(secretName, secretValue, secretDescription);
    await ingestionPage.secretsTab.expectSecretVisible(secretName);
    await ingestionPage.secretsTab.expectSecretVisible(secretDescription);

    await ingestionPage.secretsTab.deleteSecret(secretName);
    await ingestionPage.secretsTab.expectSecretNotVisible(secretName);
    await ingestionPage.secretsTab.expectSecretNotVisible(secretDescription);
  });

  test('create ingestion source using a secret', async () => {
    test.slow();

    const suffix = randomSuffix();
    const sourceName = `ingestion source ${suffix}`;
    const sourceDetails: SnowflakeFormDetails = {
      accountId: `account_${suffix}`,
      warehouseId: `warehouse_${suffix}`,
      username: `user_${suffix}`,
      role: `role_${suffix}`,
      authenticationType: 'userNameAndPassword',
      passwordSecret: FIXTURE_SECRET_NAME,
    };

    await ingestionPage.sourcesTab.open();
    await ingestionPage.sourcesTab.createIngestionSource(sourceName, {
      sourceType: 'Snowflake',
      fillForm: async () => {
        await ingestionPage.sourcesTab.snowflakeSource.fillForm(sourceDetails);
      },
    });
    await ingestionPage.sourcesTab.expectSourceVisible(sourceName);
    await ingestionPage.sourcesTab.deleteIngestionSource(sourceName);
  });
});
