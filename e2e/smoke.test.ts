import { test, expect } from '@playwright/test';

test('homepage loads and shows the todo app', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/todo/i);
});
