import { test, expect } from '@playwright/test';

test.describe('smoke', () => {
  test('home loads', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/Eterno Pet/i);
  });

  test('entrar loads', async ({ page }) => {
    const response = await page.goto('/entrar');
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('cadastrar loads', async ({ page }) => {
    const response = await page.goto('/cadastrar');
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('dashboard redirects when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/entrar/);
    expect(page.url()).toMatch(/\/entrar/);
  });

  test('health endpoint responds', async ({ request }) => {
    const res = await request.get('/api/health');
    expect([200, 503]).toContain(res.status());
    const body = await res.json();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('checks.db');
    expect(body).toHaveProperty('checks.storage');
  });
});
