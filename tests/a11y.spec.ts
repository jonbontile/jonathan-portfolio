import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/** Every page a visitor can reach on a preview build, plus the 404 page. */
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
  '/contact/sent/',
  '/contact/error/',
  '/privacy/',
  '/does-not-exist/',
];

for (const path of pages) {
  test(`axe WCAG 2.2 AA: ${path}`, async ({ page }) => {
    // Scan the settled page: no entrance animation mid-fade.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      // The Turnstile widget is a third-party cross-origin iframe.
      .exclude('.cf-turnstile')
      .analyze();

    const summary = results.violations.map(
      (v) => `${v.id} [${v.impact}] ×${v.nodes.length}: ${v.help}\n    ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join('\n    ')}`,
    );
    expect(summary, summary.join('\n')).toEqual([]);
  });
}

test('every page has exactly one h1, a title and a lang attribute', async ({ page }) => {
  for (const path of pages) {
    await page.goto(path);
    await expect(page.locator('h1'), path).toHaveCount(1);
    expect(await page.title(), path).not.toBe('');
    expect(await page.locator('html').getAttribute('lang'), path).toBe('en');
  }
});

test('skip link is the first focusable element and moves focus to main', async ({ page }) => {
  await page.goto('/about/');
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveText('Skip to main content');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
});
