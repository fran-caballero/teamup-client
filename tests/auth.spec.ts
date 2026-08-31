import { expect, test } from '@playwright/test';

test('Redirects anonymous users to login', async ({ page }) => {
  await page.goto('/home');

  await expect(page).toHaveURL('/login');
  await expect(page.getByRole('textbox', { name: 'Username' })).toBeVisible();
});

test('Users can authenticate and keep the session on reload', async ({
  page,
}) => {
  await page.goto('/login');

  const loginBtn = page.getByRole('button', { name: 'Log in' });
  const demoAccountBtn = page.getByRole('button', { name: 'Use demo account' });

  await demoAccountBtn.click();

  await expect(page.getByLabel('Password')).toHaveValue(/.+/);

  await loginBtn.click();

  await expect(page).toHaveURL('/home');
  await expect(page.getByRole('heading', { name: 'My Work' })).toBeVisible();

  await page.reload();

  await expect(page).toHaveURL('/home');
  await expect(page.getByRole('heading', { name: 'My Work' })).toBeVisible();
});
