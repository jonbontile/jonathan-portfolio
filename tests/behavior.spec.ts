import { test, expect } from '@playwright/test';

const pages = [
  '/',
  '/prototype/',
  '/about/',
  '/services/',
  '/experience/',
  '/qualifications/',
  '/case-studies/',
  '/case-studies/cpg-inventory-cogs/',
  '/contact/',
  '/privacy/',
];

// These checks don't depend on device emulation, so run them once (desktop project).
test.describe('layout and behavior', () => {
  test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'desktop', 'runs once'));

  test('reflow: no horizontal scrolling at 320 px wide (≈400% zoom, WCAG 1.4.10)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    for (const path of pages) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} overflows by ${overflow}px`).toBeLessThanOrEqual(0);
    }
  });

  test('mobile menu with JavaScript: collapsed at first paint, opens, Escape closes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/about/');
    const toggle = page.locator('.menu-toggle');
    const nav = page.locator('#site-nav');
    await expect(toggle).toBeVisible();
    await expect(nav).toBeHidden();
    await toggle.click();
    await expect(nav).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(nav).toBeHidden();
    await expect(toggle).toBeFocused();
  });

  test('reduced motion: hero entrance animation is off', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/prototype/');
    const animation = await page.locator('.hero-item').first().evaluate((el) => getComputedStyle(el).animationName);
    expect(animation).toBe('none');
  });

  test('motion allowed: hero entrance animation runs', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/prototype/');
    const animation = await page.locator('.hero-item').first().evaluate((el) => getComputedStyle(el).animationName);
    expect(animation).not.toBe('none');
  });
});

test.describe('without JavaScript', () => {
  test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'desktop', 'runs once'));
  test.use({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });

  test('mobile navigation links stay visible and usable', async ({ page }) => {
    await page.goto('/about/');
    await expect(page.locator('.menu-toggle')).toBeHidden();
    await expect(page.locator('#site-nav')).toBeVisible();
    await expect(page.locator('#site-nav a', { hasText: 'Services' })).toBeVisible();
  });
});
