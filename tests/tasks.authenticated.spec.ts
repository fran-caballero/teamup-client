import test, { expect } from '@playwright/test';

test('Users can create, update, open and delete a task', async ({ page }) => {
  await page.goto('/home');

  const mainView = page.getByRole('main');
  const sidebar = page.getByRole('complementary');
  const personalListLink = sidebar.getByRole('link', {
    name: 'Personal list',
  });

  await personalListLink.click();

  const toDoColumn = mainView
    .locator('app-task-group-column')
    .filter({ hasText: 'TO DO' });
  const inProgressColumn = mainView
    .locator('app-task-group-column')
    .filter({ hasText: 'IN PROGRESS' });
  const doneColumn = mainView
    .locator('app-task-group-column')
    .filter({ hasText: 'DONE' });

  const taskName = `E2E Task ${Date.now()}`;

  try {
    let taskLink = await test.step('Create task', async () => {
      const addTaskBtn = toDoColumn.getByRole('button', { name: 'Add Task' });

      await addTaskBtn.click();

      const taskTextbox = mainView.getByRole('textbox', {
        name: 'Task name...',
      });

      await expect(taskTextbox).toBeVisible();

      await taskTextbox.fill(taskName);
      await taskTextbox.press('Enter');

      const taskLink = toDoColumn.getByRole('link', {
        name: taskName,
        exact: true,
      });

      await expect(
        inProgressColumn.getByRole('link', { name: taskName, exact: true }),
      ).toHaveCount(0);
      await expect(
        doneColumn.getByRole('link', { name: taskName, exact: true }),
      ).toHaveCount(0);
      await expect(taskLink).toBeVisible();

      return taskLink;
    });

    await test.step('Change task status', async () => {
      const taskCard = toDoColumn.locator('.task').filter({
        has: page.getByRole('link', { name: taskName, exact: true }),
      });

      await taskLink.hover();

      const statusBtn = taskCard.getByRole('button', {
        name: 'radio_button_unchecked',
      });

      await expect(statusBtn).toBeVisible();

      await statusBtn.click();

      const inProgressBtn = page.getByRole('button', {
        name: 'IN PROGRESS',
      });

      await expect(inProgressBtn).toBeVisible();

      await inProgressBtn.click();

      taskLink = inProgressColumn.getByRole('link', {
        name: taskName,
        exact: true,
      });

      await expect(
        toDoColumn.getByRole('link', { name: taskName, exact: true }),
      ).toHaveCount(0);
      await expect(taskLink).toBeVisible();
      await expect(
        doneColumn.getByRole('link', { name: taskName, exact: true }),
      ).toHaveCount(0);
    });

    await test.step('Verify persistence', async () => {
      await taskLink.click();

      await expect(mainView.getByRole('textbox')).toHaveValue(taskName);
      await expect(
        mainView.getByRole('button', {
          name: 'IN PROGRESS',
        }),
      ).toBeVisible();

      await page.reload();

      const personalListBreadcrumbLink = page.getByRole('link', {
        name: 'Personal list',
        exact: true,
      });

      await expect(mainView.getByRole('textbox')).toHaveValue(taskName);
      await expect(
        mainView.getByRole('button', {
          name: 'radio_button_partial IN PROGRESS',
        }),
      ).toBeVisible();
      await expect(personalListBreadcrumbLink).toBeVisible();

      await personalListBreadcrumbLink.click();

      await expect(taskLink).toBeVisible();
    });
  } finally {
    await test.step('Delete task', async () => {
      await page.goto('/personal-list');

      await expect(toDoColumn).toBeVisible();

      const taskLink = mainView.getByRole('link', {
        name: taskName,
        exact: true,
      });

      if ((await taskLink.count()) === 0) {
        return;
      }

      await taskLink.hover();

      const taskCard = mainView.locator('.task').filter({
        has: page.getByRole('link', { name: taskName, exact: true }),
      });
      const taskOptionsBtn = taskCard.getByRole('button', {
        name: 'more_horiz',
      });

      await taskOptionsBtn.click();

      const listDeleteBtn = page.getByRole('button', { name: 'Delete' });

      await expect(listDeleteBtn).toBeEnabled();

      await listDeleteBtn.click();

      const deleteWarningModal = page.locator('app-delete-warning-modal');
      const modalDeleteBtn = deleteWarningModal.getByRole('button', {
        name: 'Delete',
      });

      await expect(deleteWarningModal).toBeVisible();
      await expect(modalDeleteBtn).toBeVisible();

      await modalDeleteBtn.click();

      await expect(
        toDoColumn.getByRole('link', { name: taskName, exact: true }),
      ).toHaveCount(0);
      await expect(
        inProgressColumn.getByRole('link', { name: taskName, exact: true }),
      ).toHaveCount(0);
      await expect(
        doneColumn.getByRole('link', { name: taskName, exact: true }),
      ).toHaveCount(0);
    });
  }
});
