import { expect, test } from '@playwright/test';

test('Users can navigate the workspace hierarchy and switch views', async ({
  page,
}) => {
  await page.goto('/home');

  const mainView = page.getByRole('main');
  const sidebar = page.getByRole('complementary');

  await expect(sidebar).toBeVisible();

  const spaceLink = sidebar.getByRole('link', {
    name: 'Production',
    exact: true,
  });

  await expect(spaceLink).toBeVisible();

  await spaceLink.click();

  const spaceName = 'Production';
  const folderName = 'Tech Summit 2026';
  const listName = 'Speaker management';
  const taskName = 'Marcus Thorne';

  const breadCrumbsBar = page.locator('app-breadcrumbs-bar');
  const breadCrumbSpaceText = breadCrumbsBar.getByText(spaceName);
  const breadCrumbFolderText = breadCrumbsBar.getByText(folderName);
  const breadCrumbListText = breadCrumbsBar.getByText(listName);

  const targetingColumn = mainView
    .locator('app-task-group-column')
    .filter({ hasText: 'TARGETING' });
  const targetingBtn = page.getByRole('button', {
    name: 'TARGETING',
  });
  const taskCard = targetingColumn.locator('.task').filter({
    has: page.getByRole('link', { name: taskName, exact: true }),
  });
  const list = mainView
    .locator('.list')
    .filter({ has: page.getByRole('link', { name: listName }) });
  const taskGroup = list
    .locator('.list__task-group')
    .filter({ has: targetingBtn });
  const taskRow = list.locator('.task-group__row').filter({
    has: page.getByRole('link', { name: taskName, exact: true }),
  });

  await expect(targetingColumn).toBeVisible();
  await expect(taskCard).toBeVisible();
  await expect(list).toHaveCount(0);
  await expect(taskGroup).toHaveCount(0);
  await expect(taskRow).toHaveCount(0);

  const listViewLink = mainView.getByRole('link', {
    name: 'List',
    exact: true,
  });
  const boardViewLink = mainView.getByRole('link', {
    name: 'Board',
    exact: true,
  });

  await expect(listViewLink).toBeVisible();
  await expect(boardViewLink).toBeVisible();

  await listViewLink.click();

  await expect(page).toHaveURL(
    (url) => url.searchParams.get('view') === 'list',
  );
  await expect(targetingColumn).toHaveCount(0);
  await expect(taskCard).toHaveCount(0);
  await expect(list).toBeVisible();
  await expect(taskGroup).toBeVisible();
  await expect(taskRow).toBeVisible();

  const folderLink = list.getByRole('link', {
    name: 'Tech Summit 2026 /',
    exact: true,
  });

  await expect(folderLink).toBeVisible();

  await folderLink.click();

  const folderListView = mainView.locator('app-folder-list-view');

  await expect(folderListView).toBeVisible();

  const listLink = folderListView.getByRole('link', {
    name: 'Speaker management',
    exact: true,
  });

  await listLink.click();
  await boardViewLink.click();

  await expect(page).toHaveURL(
    (url) => url.searchParams.get('view') === 'board',
  );

  await expect(targetingColumn).toBeVisible();
  await expect(taskCard).toBeVisible();
  await expect(taskGroup).toHaveCount(0);
  await expect(taskRow).toHaveCount(0);

  const spaceBreadcrumbLink = breadCrumbsBar.getByRole('link', {
    name: spaceName,
  });
  const folderBreadcrumbLink = breadCrumbsBar.getByRole('link', {
    name: folderName,
  });

  await expect(breadCrumbSpaceText).toBeVisible();
  await expect(breadCrumbFolderText).toBeVisible();
  await expect(breadCrumbListText).toBeVisible();
  await expect(spaceBreadcrumbLink).toBeVisible();
  await expect(folderBreadcrumbLink).toBeVisible();

  await folderBreadcrumbLink.click();

  await expect(breadCrumbSpaceText).toBeVisible();
  await expect(breadCrumbFolderText).toBeVisible();
  await expect(breadCrumbListText).toHaveCount(0);

  await spaceBreadcrumbLink.click();

  await expect(breadCrumbSpaceText).toBeVisible();
  await expect(breadCrumbFolderText).toHaveCount(0);
  await expect(breadCrumbListText).toHaveCount(0);
});
