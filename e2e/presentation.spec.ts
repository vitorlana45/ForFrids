import { test, expect } from '@playwright/test';

test.describe('apresentação', () => {
  // Em dev, notFound() renderiza a UI de "não encontrado" com status 200; só vira
  // 404 real no build de producao. Por isso checamos o CONTEUDO, que vale nos dois.
  test('memorial inexistente na rota de apresentacao mostra "nao encontrado"', async ({ page }) => {
    await page.goto('/memorial/inexistente-xyz-123/apresentacao');
    await expect(page.getByRole('heading', { name: /Memorial não encontrado/i })).toBeVisible();
  });
});
