# Configuração do Cloudflare R2

Guia completo para configurar o Cloudflare R2 como storage de imagens em produção.

## O que já foi feito (via Wrangler CLI)

```bash
npx wrangler login                            # autenticou com vitoresmerio00@gmail.com
npx wrangler r2 bucket create eterno-pet     # bucket criado
npx wrangler r2 bucket dev-url enable eterno-pet  # acesso público habilitado
```

**Valores gerados:**

| Campo | Valor |
|-------|-------|
| Account ID | `d5c544a67d00884daef3fc3d5690578b` |
| Bucket | `eterno-pet` |
| URL pública | `https://pub-2a53d708f3034c6cb79d543ec47fc9ba.r2.dev` |
| Access Key ID | `9ccb2e1665e5f3c0652f379c13ff7683` |
| Secret Access Key | *(salvo apenas no `.env.local` e nas env vars de produção)* |

---

## Variáveis de ambiente para produção

Configure essas vars no **Vercel** (ou Coolify para staging):

```env
STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=d5c544a67d00884daef3fc3d5690578b
R2_ACCESS_KEY_ID=9ccb2e1665e5f3c0652f379c13ff7683
R2_SECRET_ACCESS_KEY=<ver .env.local>
R2_BUCKET_NAME=eterno-pet
R2_PUBLIC_URL=https://pub-2a53d708f3034c6cb79d543ec47fc9ba.r2.dev
```

### No Vercel

```bash
vercel env add STORAGE_PROVIDER production
vercel env add R2_ACCOUNT_ID production
vercel env add R2_ACCESS_KEY_ID production
vercel env add R2_SECRET_ACCESS_KEY production
vercel env add R2_BUCKET_NAME production
vercel env add R2_PUBLIC_URL production
```

---

## Verificar se está funcionando

Após o deploy, edita o avatar de um pet. A URL salva no banco deve ser:

```
https://pub-2a53d708f3034c6cb79d543ec47fc9ba.r2.dev/pets/{userId}/{petId}/avatar.webp
```

Confirma no dashboard: **R2 → eterno-pet → Objects**

---

## Comandos úteis

```bash
# Listar buckets
npx wrangler r2 bucket list

# Ver objetos no bucket
npx wrangler r2 object list eterno-pet

# Deletar objeto
npx wrangler r2 object delete eterno-pet pets/uid/pet-id/avatar.webp

# Ver info do bucket
npx wrangler r2 bucket info eterno-pet
```
