import { test } from '../../fixtures/base-test';
import { IngestionV3Page } from '../../pages/ingestion/v3/ingestion-v3.page';
import crypto from 'crypto';

function randomSuffix() {
  return crypto.randomBytes(4).toString('hex');
}

test.use({ featureName: 'ingestion-v3' });

test.describe('secrets tab in manage data sources', () => {
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
    await ingestionPage.secretsTab.open();
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
});
