import { expect, test as setup } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('Authenticate', async ({ page }) => {
  await page.goto('/login');

  const loginBtn = page.getByRole('button', { name: 'Log in' });
  const demoAccountBtn = page.getByRole('button', { name: 'Use demo account' });

  await demoAccountBtn.click();
  await loginBtn.click();

  await expect(page).toHaveURL('/home');
  await expect(page.getByRole('heading', { name: 'My Work' })).toBeVisible();

  const scheduledResetMessage = page.getByText(
    'This demo account will be reset soon.',
  );

  await expect(
    scheduledResetMessage,
    'The demo account will be reset soon',
  ).toHaveCount(0);

  await page.context().storageState({ path: authFile });
});
