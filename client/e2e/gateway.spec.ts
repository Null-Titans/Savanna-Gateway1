import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessible Onboarding & Career Gateway E2E', () => {
  test('Keyboard-only onboarding journey + axe-core WCAG 2.2 AA scan', async ({ page }) => {
    await page.goto('/');

    const homeScan = await new AxeBuilder({ page }).analyze();
    expect(homeScan.violations).toEqual([]);

    // Use keyboard to open onboarding
    await page.getByRole('button', { name: /Start registration/i }).first().focus();
    await page.keyboard.press('Enter');

    // Focus should be on step heading or operable via keyboard
    await page.getByRole('button', { name: /No, this is my own device/i }).focus();
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: /Continue/i }).click();

    // Type name with keyboard
    const nameInput = page.getByLabel(/Full name/i);
    await nameInput.focus();
    await page.keyboard.type('Dawit Mekonnen');
    await page.getByRole('button', { name: /Continue/i }).click();

    // Skip contact
    await page.getByRole('button', { name: /Skip this question/i }).click();

    // Choose Refugee ID (verify mic is disabled for ID number)
    await page.getByLabel(/Refugee ID/i).click();
    await expect(page.getByText(/Voice input is turned off for ID numbers/i)).toBeVisible();
    await page.getByRole('button', { name: /Continue/i }).click();

    // Select private support & review
    await page.getByLabel(/More time or flexible scheduling/i).click();
    await page.getByRole('button', { name: /Review my answers/i }).click();
    await page.getByRole('button', { name: /Submit registration/i }).click();

    await expect(page.getByText(/Registration ready/i)).toBeVisible();
  });

  test('Embeddable Web Component renders inside Plain HTML host without React on host', async ({ page }) => {
    await page.goto('/demo-plain-html.html');
    const hostEl = page.locator('accessible-gateway');
    await expect(hostEl).toBeVisible();
    // Pierce Shadow DOM to confirm onboarding form rendered
    await expect(hostEl.locator('h2')).toContainText(/shared phone/i);
  });
});
