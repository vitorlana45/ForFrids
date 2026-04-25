# Eterno Pet - Funcionalidades, imagens e estrategia de storage

Ultima analise: 25 de abril de 2026.

## Objetivo

Este documento registra o que o Eterno Pet faz hoje, quais funcionalidades usam imagem, onde existe risco de crescimento descontrolado de storage e qual politica de cotas devemos adotar antes de escalar o SaaS.

A conclusao curta: podemos continuar com Supabase Storage no curto e medio prazo, mas precisamos implementar cotas por plano, compressao de imagem, rastreio de uso por conta e limpeza de arquivos orfaos. MinIO/S3 deve entrar como camada futura para arquivo frio, originais, exportacoes ou contas muito grandes, nao como substituto imediato para as imagens publicas do memorial.

## O que o projeto faz hoje

| Area | Funcionalidade | Status | Usa imagem? |
| --- | --- | --- | --- |
| Autenticacao | Cadastro, login e callback Supabase Auth | Implementado | Nao |
| Dashboard | Visao geral dos pets, acoes rapidas, datas e cards | Implementado | Exibe avatar do pet |
| Pet | Criar/editar memorial, dados, privacidade e foto | Implementado | Sim, avatar |
| Linha do tempo | Momentos com titulo, descricao, data e fotos | Implementado | Sim, ate 4 imagens por momento |
| Memorial publico | Pagina publica com capa, linha do tempo, galeria, homenagens, cronicas e acoes | Implementado | Exibe avatar, timeline e capas |
| Homenagens | Visitante autenticado envia mensagem; tutor aprova/rejeita | Implementado | Nao |
| Alertas | Sino com pedidos de aprovacao, curtidas e eventos | Implementado | Nao diretamente |
| Curtidas | Usuario autenticado pode reagir a memorial publico | Implementado | Nao |
| Diario de Cronicas | Cronicas premium com texto, fase, humor, data e capa | Implementado | Sim, capa da cronica |
| Capsulas do Tempo | Mensagens privadas com data futura de abertura | Implementado | Nao |
| QR Code | Geracao e download de QR do memorial | Implementado | Nao persiste imagem no storage |
| Planos/Stripe | Free, Premium, Eterno, checkout e webhook | Implementado | Nao |
| Emails/Resend | Welcome, notificacao de homenagem e lembretes | Implementado/parcial | Nao |
| Tema/loading | Dark mode, loaders globais e loaders de operacao | Implementado | Nao |

## Onde imagens entram hoje

| Funcionalidade | Arquivo principal | Bucket | Campo no banco | Limite tecnico atual | Limite de negocio atual |
| --- | --- | --- | --- | --- | --- |
| Avatar do pet | `src/components/pets/PetForm.tsx` | `pet-photos` | `pets.avatar_url` | bucket limita 5 MB; aceita jpeg/png/webp | 1 avatar por pet, mas sem cota total por conta |
| Fotos da linha do tempo | `src/components/timeline/TimelineManager.tsx` | `pet-photos` | `timeline_entries.photo_urls[]` | componente limita 4 fotos por momento e 5 MB por arquivo | sem limite total de momentos/fotos por conta |
| Capa da cronica | `src/components/chronicles/ChronicleEditor.tsx` | `chronicle-photos` | `chronicles.cover_url` | bucket limita 5 MB; aceita jpeg/png/webp | 1 capa por cronica, mas sem limite total de cronicas/capas por conta |
| Galeria publica | `src/app/memorial/[slug]/page.tsx` | reaproveita `pet-photos` | derivada de `timeline_entries.photo_urls[]` | nao faz upload proprio | depende da linha do tempo |
| QR Code | `src/components/qrcode/QRGenerator.tsx` | nenhum | nenhum | download local no browser | nao consome storage |

Os buckets sao criados em `supabase/migrations/20260425000000_social_chronicles_billing.sql` com `file_size_limit = 5242880`, publico `true` e MIME types `image/jpeg`, `image/png`, `image/webp`.

## Riscos atuais

| Risco | Impacto | Gravidade |
| --- | --- | --- |
| Linha do tempo sem limite total por conta | Usuario pode criar muitos momentos com 4 imagens cada | Alta |
| Cronicas sem limite total | Premium/Eterno pode subir capa em muitas cronicas | Media |
| Lifetime com pets ilimitados | Se tambem parecer storage ilimitado, cria custo mensal eterno para receita unica | Alta |
| Upload direto pelo client | A UI limita, mas a regra forte de cota ainda nao existe no servidor/storage | Alta |
| Arquivos orfaos | Ao remover foto da timeline ou trocar capa/avatar, o objeto antigo pode continuar no bucket | Alta |
| Sem compressao client-side | Uma imagem de celular pode consumir perto de 5 MB mesmo quando 400 KB resolveria | Alta |
| Buckets publicos | Bom para performance, mas exige cuidado com caminhos, delecao e abuso | Media |
| Egress publico | Memorial compartilhado pode gerar mais custo por trafego do que por armazenamento | Media |

## Custos e limites atuais do Supabase

Valores consultados na documentacao oficial em 25 de abril de 2026:

| Item | Free | Pro/Team | Excedente |
| --- | --- | --- | --- |
| Storage | 1 GB | 100 GB inclusos | US$ 0.021 por GB/mes |
| Egress uncached | 5 GB | 250 GB inclusos | US$ 0.09 por GB |
| Egress cached/CDN | 5 GB | 250 GB inclusos | US$ 0.03 por GB |
| File size global | ate 50 MB no Free | ate 500 GB no Pro+ | configuravel por bucket |
| Transformacoes de imagem | indisponivel no Free | 100 inclusas | US$ 5 por 1.000 transformacoes |

Fontes:

- Supabase Storage pricing: https://supabase.com/docs/guides/storage/management/pricing
- Supabase storage size usage: https://supabase.com/docs/guides/platform/manage-your-usage/storage-size
- Supabase egress usage: https://supabase.com/docs/guides/platform/manage-your-usage/egress
- Supabase file upload limits: https://supabase.com/docs/guides/storage/uploads/file-limits
- Supabase billing overview: https://supabase.com/docs/guides/platform/billing-on-supabase

Leitura importante: o custo de storage puro e baixo. O problema do SaaS nao e somente armazenar 300 GB; e permitir upload ilimitado, trafego publico imprevisivel, arquivos orfaos e planos lifetime sem limite de midia.

## Estimativas praticas

### Premissas

| Cenario | Tamanho medio por imagem |
| --- | --- |
| Sem compressao, usando limite atual | ate 5 MB |
| Com compressao recomendada | 0.8 MB a 1.5 MB |
| Avatar/capa bem otimizados | 0.3 MB a 0.8 MB |

### Exemplos de custo mensal no Supabase Pro

| Cenario | Storage estimado | Excedente storage | Custo storage | Egress cached se tudo for visto 1x/mes | Custo egress cached |
| --- | ---: | ---: | ---: | ---: | ---: |
| 10.000 contas Free com 10 MB cada | 100 GB | 0 GB | US$ 0 | 100 GB | US$ 0 |
| 1.000 Premium com 300 MB cada | 300 GB | 200 GB | US$ 4.20 | 300 GB | US$ 1.50 |
| 1.000 Premium com 1 GB cada | 1 TB | 900 GB | US$ 18.90 | 1 TB | US$ 22.50 |
| 100 Lifetime com 5 GB cada | 500 GB | 400 GB | US$ 8.40 | 500 GB | US$ 7.50 |

Esses numeros mostram que storage nao quebra sozinho. O que pode quebrar margem e abuso, muitas visualizacoes publicas, ausencia de limpeza e prometer midia ilimitada para pagamento unico.

## Politica recomendada por plano

### Free

| Recurso | Cota recomendada |
| --- | --- |
| Pets | 1 pet |
| Avatar | 1 por pet |
| Linha do tempo | ate 6 fotos no total |
| Fotos por momento | ate 2 |
| Cronicas com capa | nao disponivel |
| Capsulas | nao disponivel |
| QR Code | nao disponivel |
| Limite de midia por conta | 25 MB |
| Tamanho final por imagem | ate 1.5 MB |

Objetivo: permitir experimentar o memorial sem virar hospedagem gratuita de fotos.

### Premium

| Recurso | Cota recomendada |
| --- | --- |
| Pets | 5 pets |
| Avatar | 1 por pet |
| Linha do tempo | ate 300 fotos por conta |
| Fotos por momento | ate 4 |
| Cronicas | ate 100 cronicas com capa por conta |
| Capsulas | texto, sem impacto relevante em storage |
| QR Code | liberado; download local |
| Limite de midia por conta | 1 GB |
| Tamanho final por imagem | ate 2 MB |

Objetivo: oferta generosa para usuario pagante, com custo previsivel.

### Eterno/Lifetime

| Recurso | Cota recomendada |
| --- | --- |
| Pets | ilimitados ou muito alto, mantendo fair use |
| Avatar | 1 por pet |
| Linha do tempo | ate 1.500 fotos por conta |
| Fotos por momento | ate 4 |
| Cronicas | ate 500 cronicas com capa por conta |
| Limite de midia incluso | 5 GB |
| Tamanho final por imagem | ate 2 MB |
| Extra recomendado | add-on recorrente de midia, nao vitalicio ilimitado |

Regra de produto: "memoriais ilimitados" nao deve significar "armazenamento ilimitado". Storage gera custo mensal para sempre; plano lifetime gera receita uma vez.

## Limites tecnicos que devemos implementar

### 1. Criar uma camada central de limites

Arquivo sugerido: `src/lib/media-limits.ts`.

Deve conter:

- `maxMediaBytesByPlan`
- `maxTimelinePhotosByPlan`
- `maxChronicleCoversByPlan`
- `maxPhotosPerTimelineEntry`
- `maxFinalImageBytes`
- `allowedMimeTypes`
- helpers como `canUploadMedia(planId, currentUsage, incomingBytes)`

Hoje `src/lib/plans.ts` controla features e quantidade de pets; a nova camada deve controlar midia.

### 2. Criar tabela `media_assets`

Tabela sugerida:

```sql
create table public.media_assets (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  pet_id uuid references public.pets(id) on delete cascade,
  feature text not null check (feature in ('pet_avatar', 'timeline_photo', 'chronicle_cover')),
  provider text not null default 'supabase',
  bucket text not null,
  object_path text not null,
  public_url text not null,
  size_bytes bigint not null,
  mime_type text not null,
  status text not null default 'active' check (status in ('pending', 'active', 'deleted')),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_media_assets_owner on public.media_assets(owner_id, status);
create index idx_media_assets_pet on public.media_assets(pet_id, feature, status);
```

Motivo: sem essa tabela, fica caro saber quanto cada usuario usa e impossivel impor cota de forma confiavel.

### 3. Trocar upload livre por fluxo autorizado

Fluxo recomendado:

1. Client seleciona imagem.
2. Client comprime/converte para WebP.
3. Server Action valida plano, feature, quantidade e bytes.
4. Server Action cria um registro `media_assets` como `pending`.
5. Server Action retorna caminho permitido ou signed upload URL.
6. Client faz upload.
7. Server Action confirma `active` e grava o campo final no pet/timeline/chronicle.

Isso impede bypass da UI e prepara o projeto para Supabase, MinIO ou outro S3 no futuro.

### 4. Compressao obrigatoria antes do upload

Recomendacao:

- Converter jpeg/png grandes para WebP.
- Max largura: 1600 px para timeline e cronica.
- Max largura: 800 px para avatar.
- Qualidade: 0.75 a 0.82.
- Remover EXIF.
- Rejeitar se o resultado passar do limite final.

Isso reduz custo e melhora carregamento publico.

### 5. Limpeza de arquivos orfaos

Hoje devemos tratar:

- Avatar antigo quando troca foto.
- Foto removida de um momento da timeline.
- Fotos de timeline quando o momento e deletado.
- Capa antiga quando troca capa da cronica.
- Capas quando cronica e deletada.
- Tudo quando pet e deletado.

Criar uma rotina `deleteMediaAsset()` e um cron semanal de auditoria:

- listar `media_assets` com `status = deleted`;
- apagar do provider;
- procurar objetos no bucket sem registro ativo;
- gerar relatorio antes de deletar em massa.

### 6. Monitoramento

Dashboard interno minimo:

| Metrica | Por que importa |
| --- | --- |
| Storage total por provider | custo direto |
| Storage por plano | margem por plano |
| Top 50 contas por uso | abuso/fair use |
| Media assets orfaos | vazamento silencioso |
| Egress mensal estimado | custo de memorial publico |
| Media por pet | identificar pets gigantes |

## Supabase vs MinIO/S3

### Manter Supabase para midia quente

Usar Supabase Storage para:

- avatar do pet;
- fotos visiveis na linha do tempo;
- capas de cronicas;
- imagens que aparecem em memorial publico;
- conteudo que precisa de CDN simples e integracao direta com auth/RLS.

Motivo: o produto depende de compartilhamento publico e carregamento rapido. Supabase ja oferece Storage com CDN e politicas integradas.

### Usar MinIO/S3 para midia fria ou grande

Usar MinIO/S3 no futuro para:

- originais em alta resolucao, se decidirmos guardar;
- exportacoes de livro/memorial em PDF;
- backups de midia;
- anexos privados pouco acessados;
- contas enterprise ou acervos muito grandes;
- arquivos que nao precisam aparecer imediatamente no memorial publico.

Fontes sobre MinIO:

- MinIO S3 compatibility: https://min.io/docs/minio/linux/reference/s3-api-compatibility.html
- MinIO open source/AGPL: https://github.com/minio/minio

Observacao importante: MinIO self-hosted nao elimina custo. Ele troca custo de storage gerenciado por custo de servidor, disco, backup, monitoramento, disponibilidade, SSL, CDN e operacao. Para memorial publico, se nao houver CDN na frente, a experiencia pode piorar.

## Arquitetura preparada para multiplos providers

Criar uma interface:

```ts
export type MediaProviderId = 'supabase' | 'minio';

export interface MediaUploadRequest {
  ownerId: string;
  petId?: string;
  feature: 'pet_avatar' | 'timeline_photo' | 'chronicle_cover';
  fileName: string;
  sizeBytes: number;
  mimeType: string;
}

export interface MediaStorageProvider {
  id: MediaProviderId;
  createUpload(input: MediaUploadRequest): Promise<{ bucket: string; path: string; uploadUrl?: string }>;
  getPublicUrl(bucket: string, path: string): string;
  deleteObject(bucket: string, path: string): Promise<void>;
}
```

Regra inicial:

| Feature | Provider inicial | Provider futuro |
| --- | --- | --- |
| pet_avatar | Supabase | Supabase |
| timeline_photo otimizada | Supabase | Supabase |
| chronicle_cover otimizada | Supabase | Supabase |
| original de alta resolucao | nao guardar agora | MinIO/S3 |
| exportacao PDF | nao implementado | MinIO/S3 |
| arquivo privado frio | nao implementado | MinIO/S3 |

## Quando considerar MinIO de verdade

Nao implementar MinIO agora so por medo de custo. Implementar quando pelo menos um destes pontos acontecer:

- storage total passar de 500 GB com crescimento acelerado;
- cached egress passar de 1 TB/mes;
- precisarmos guardar originais grandes;
- surgirem planos enterprise/acervos familiares grandes;
- precisarmos de lifecycle/archive fora do Supabase;
- o custo operacional de Supabase + egress ficar maior que infra S3/MinIO + CDN + manutencao.

Antes disso, a melhor alavanca e compressao + cotas + limpeza.

## Proposta de roadmap

### Fase 1 - Seguranca de custo

- Criar `media-limits.ts`.
- Implementar compressao client-side.
- Bloquear upload acima do limite final.
- Adicionar contadores simples por feature.
- Mostrar erro amigavel quando a conta atingir cota.

### Fase 2 - Governanca de midia

- Criar `media_assets`.
- Migrar avatar, timeline e cronica para registrar assets.
- Criar delete real no storage quando remover/trocar imagem.
- Criar job de limpeza de orfaos.

### Fase 3 - Produto e monetizacao

- Mostrar uso de midia em `/dashboard/configuracoes`.
- Adicionar aviso "X% do armazenamento usado".
- Criar add-on de midia para Premium/Eterno.
- Ajustar copy do Lifetime para deixar claro que midia tem fair use.

### Fase 4 - Provider abstraction

- Criar `MediaStorageProvider`.
- Implementar provider Supabase.
- Preparar provider S3/MinIO sem ativar por padrao.
- Guardar `provider`, `bucket` e `object_path` em `media_assets`.

### Fase 5 - MinIO/S3 se fizer sentido

- Definir infra, backup, CDN e monitoramento.
- Ativar apenas para midia fria.
- Manter derivados publicos otimizados no Supabase/CDN.

## Decisao recomendada agora

1. Continuar usando Supabase Storage para imagens publicas.
2. Nao vender armazenamento ilimitado, especialmente no Lifetime.
3. Implementar cotas antes de abrir escala.
4. Comprimir toda imagem antes do upload.
5. Rastrear cada arquivo em `media_assets`.
6. Limpar objetos antigos/orfaos.
7. Preparar interface para MinIO/S3, mas so migrar quando houver volume real que justifique a complexidade.

