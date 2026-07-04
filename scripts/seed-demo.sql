-- =============================================================================
-- Eterno Pet — Memorial de Exemplo (Fridis)
-- Idempotente: pode ser executado múltiplas vezes sem efeitos colaterais.
-- Execute no Supabase SQL Editor ou via: psql $DATABASE_URL -f scripts/seed-demo.sql
-- =============================================================================

-- UUIDs fixos
-- Demo user:    00000000-0000-0000-0000-000000000001
-- Pet Fridis:   00000000-0000-0000-0000-000000000002
-- Timeline:     00000000-0000-0000-0000-00000000001{0-7}
-- Crônicas:     00000000-0000-0000-0000-00000000002{0-2}
-- Tributos:     00000000-0000-0000-0000-00000000003{0-4}
-- Reação:       00000000-0000-0000-0000-000000000040

-- -----------------------------------------------------------------------------
-- 1. Demo user (auth.users → profiles)
-- -----------------------------------------------------------------------------

INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'demo@eternopet.com.br',
  '$2a$10$Q7QZQZQZQZQZQZQZQZQZQZEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (
  id,
  email,
  full_name,
  guardian_title,
  bio,
  plan_id,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'demo@eternopet.com.br',
  'Maria Clara Mendes',
  'Tutora e guardiã de memórias',
  'Passei 13 anos ao lado da Fridis. Cada foto, cada trilha, cada manhã com ela foi um presente. Este espaço é meu jeito de mantê-la viva para sempre.',
  'premium',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. Pet Fridis
-- -----------------------------------------------------------------------------

INSERT INTO pets (
  id,
  owner_id,
  name,
  species,
  breed,
  birth_date,
  death_date,
  avatar_url,
  memorial_slug,
  is_public,
  tribute_text,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Fridis',
  'Cachorra',
  'Border Collie',
  '2010-03-14',
  '2023-09-01',
  'https://picsum.photos/seed/fridis-avatar/800/800',
  'fridis',
  true,
  'Você me ensinou que amor não precisa de palavras. Só de presença.',
  now(),
  now()
) ON CONFLICT (memorial_slug) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. Timeline — 8 momentos da vida
-- -----------------------------------------------------------------------------

INSERT INTO timeline_entries (id, pet_id, title, description, date, photo_urls, created_at) VALUES

(
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000002',
  'Primeiro dia em casa',
  'Chegou com 6 semanas, cabia na palma da minha mão. Passou a noite inteira encolhida no meu colo e eu entendi que minha vida nunca mais seria a mesma.',
  '2010-03-20',
  ARRAY[
    'https://picsum.photos/seed/fridis-home1/800/600',
    'https://picsum.photos/seed/fridis-home2/800/600'
  ],
  now() - interval '13 years'
),

(
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000002',
  'Primeira vez no mar',
  'Levei ela até Florianópolis com um ano. Quando viu as ondas, parou na areia por uns cinco minutos só olhando. Depois saiu correndo em direção à água sem mais hesitar. Saiu encharcada, com areia nos olhos e a língua de fora. Nunca vi algo tão puro.',
  '2011-06-12',
  ARRAY[
    'https://picsum.photos/seed/fridis-praia1/800/600',
    'https://picsum.photos/seed/fridis-praia2/800/600',
    'https://picsum.photos/seed/fridis-praia3/800/600'
  ],
  now() - interval '12 years'
),

(
  '00000000-0000-0000-0000-000000000012',
  '00000000-0000-0000-0000-000000000002',
  'Aprendeu a dar a pata',
  'Levei duas semanas de treino com biscoitinhos para ela aprender. No dia que funcionou de primeira, as duas nos olhamos por um segundo antes de eu começar a chorar de tanto rir. Ela ficou me lambendo a cara achando que tinha feito algo errado.',
  '2013-08-05',
  ARRAY[]::text[],
  now() - interval '11 years'
),

(
  '00000000-0000-0000-0000-000000000013',
  '00000000-0000-0000-0000-000000000002',
  'Dia dos namorados — só nós duas',
  'Estava passando por uma separação difícil. Comprei uma pizza, abri um vinho e dividi a noite com ela no sofá. Fridis ficou encostada no meu ombro o tempo todo, como se soubesse. Aquele foi o dia dos namorados mais honesto da minha vida.',
  '2015-02-14',
  ARRAY[
    'https://picsum.photos/seed/fridis-namorados/800/600'
  ],
  now() - interval '9 years'
),

(
  '00000000-0000-0000-0000-000000000014',
  '00000000-0000-0000-0000-000000000002',
  'Trilha na Serra Gaúcha',
  'Cinco dias em Gramado. Ela subia cada morro na frente, olhava para trás esperando por mim, e voltava quando eu demorava. Nunca me senti tão cuidada por alguém.',
  '2017-11-30',
  ARRAY[
    'https://picsum.photos/seed/fridis-trilha1/800/600',
    'https://picsum.photos/seed/fridis-trilha2/800/600',
    'https://picsum.photos/seed/fridis-trilha3/800/600',
    'https://picsum.photos/seed/fridis-trilha4/800/600'
  ],
  now() - interval '7 years'
),

(
  '00000000-0000-0000-0000-000000000015',
  '00000000-0000-0000-0000-000000000002',
  'O diagnóstico — e a força que ela me deu',
  'Com 9 anos, descobrimos um problema cardíaco. O veterinário me explicou os cuidados, as restrições, os remédios. Eu saí da consulta com os olhos cheios de água. Ela saiu balançando o rabo. Me ensinou na hora como era para eu reagir.',
  '2019-07-22',
  ARRAY[]::text[],
  now() - interval '5 years'
),

(
  '00000000-0000-0000-0000-000000000016',
  '00000000-0000-0000-0000-000000000002',
  'Último Natal juntas',
  'Ela já estava mais lenta, dormia mais, comia menos. Mas no Natal de 2021, ficou acordada até a meia-noite do meu lado no sofá enquanto a família toda conversava. Como se soubesse que aquele momento precisava ser inteiro.',
  '2021-12-25',
  ARRAY[
    'https://picsum.photos/seed/fridis-natal1/800/600',
    'https://picsum.photos/seed/fridis-natal2/800/600'
  ],
  now() - interval '3 years'
),

(
  '00000000-0000-0000-0000-000000000017',
  '00000000-0000-0000-0000-000000000002',
  'A última manhã no jardim',
  'Quatro dias antes de partir. Levei ela para o jardim às 7h, como sempre. Ela ficou deitada no sol por quase uma hora, os olhos fechados, respirando devagar. Eu fiquei do lado, em silêncio. Não precisava de mais nada.',
  '2023-08-28',
  ARRAY[
    'https://picsum.photos/seed/fridis-jardim1/800/600',
    'https://picsum.photos/seed/fridis-jardim2/800/600'
  ],
  now() - interval '1 year'
)

ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. Crônicas (3 publicadas — visíveis pois owner tem plan_id = 'premium')
-- -----------------------------------------------------------------------------

INSERT INTO chronicles (
  id, pet_id, title, content, excerpt, cover_url,
  event_date, life_phase, mood, is_published, reading_minutes,
  created_at, updated_at
) VALUES

(
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000002',
  'O dia que ela me escolheu',
  'Eu tinha ido à fazenda para escolher um filhote. A ninhada tinha seis — todos correndo, latindo, disputando atenção. Eu fiquei agachada no meio deles sem saber por onde começar.

Então algo me puxou pelo canto do olho.

No cantinho mais afastado do cercado, uma filhote branca e preta estava sentada sozinha, me observando com aqueles olhos escuros e sérios. Não corria. Não latia. Só olhava. Como se estivesse me avaliando.

Me aproximei devagar. Ela não recuou. Quando eu abaixei a mão, ela veio — devagar, sem pressa — e encostou o focinho na minha palma. Ficou assim por um tempo. Depois levantou os olhos para mim.

Pronto. A escolha tinha sido feita. Por ela.

No caminho para casa, ela dormiu enrolada no meu colo dentro do carro, latejando devagar no meu peito. Eu tinha 29 anos, acabei de sair de um emprego que não me fazia bem, e estava começando tudo de novo. Não sabia que ela também estava começando.

Naquela semana, ela aprendeu meu cheiro. Eu aprendi o ritmo da respiração dela. Quando o veterinário perguntou o nome, eu hesitei por um segundo. Fridis. Como a deusa nórdica da fertilidade e do amor. Parecia certo para algo que já nascia tão grande.

Treze anos depois, ainda penso naquele momento no cercado. Naquela filhote que não correu, não late, só esperou. Como se soubesse que eu ia chegar.

Às vezes acho que fui eu que a escolhi. Mas toda vez que me lembro daquele olhar — tranquilo, certo, completo — sei que não foi bem assim.

Foi ela.',
  'No cantinho mais afastado do cercado, uma filhote branca e preta estava sentada sozinha, me observando. Não corria. Não latia. Só olhava. Como se estivesse me avaliando.',
  'https://picsum.photos/seed/fridis-cronica1/1440/900',
  '2010-03-20',
  'Infancia',
  'Alegre',
  true,
  3,
  now() - interval '6 months',
  now() - interval '6 months'
),

(
  '00000000-0000-0000-0000-000000000021',
  '00000000-0000-0000-0000-000000000002',
  'Envelhecendo juntas',
  'Tem uma manhã que não sai da minha cabeça.

Fridis tinha uns 10 anos. Levantei cedo, desci para a cozinha, e ela não veio correndo como sempre fazia. Fui procurar e a encontrei deitada na cama dela, me olhando. Se levantou devagar — aquela lentidão nova que eu estava aprendendo a reconhecer — e veio até mim com o mesmo afeto de sempre, mas num ritmo diferente.

Foi a primeira vez que senti o tempo de um jeito físico.

Não é que ela estava doente. Era só a vida acontecendo. Os pêlos ao redor do focinho ficando brancos. As articulações um pouco mais rígidas nas manhãs de inverno. O sono mais longo, mais profundo. Ela continuava sendo a Fridis — curiosa, presente, fiel — mas com um volume mais baixo.

Aprendi a acompanhar esse novo ritmo.

Nas caminhadas, parei de olhar o relógio. A gente ia no tempo dela. Às vezes sentávamos no meio do caminho só para ela ficar olhando para as folhas se mexendo. Eu ficava do lado, sem pressa. Comecei a entender que a pressa tinha sido sempre minha, nunca dela.

Nas noites, ela passou a dormir mais perto. Encostada no meu pé, ou com a cabeça na minha perna. Acho que ela também sentia que o tempo estava diferente. Que a gente precisava ser mais intencional com ele.

Tem uma coisa que ninguém te conta sobre envelhecer ao lado de um animal: você aprende a ficar presente de um jeito que nenhum livro de autoajuda consegue ensinar. Porque eles não têm calendário. Não têm passado para lamentar nem futuro para temer. Eles têm só agora.

E agora, com ela do meu lado, sempre foi suficiente.

Envelhecemos juntas, eu e Fridis. Eu com as minhas preocupações e ela com a sua sabedoria quieta. No final, ela me ensinou mais sobre viver bem do que qualquer coisa que eu já li ou aprendi.',
  'Aprendi a acompanhar o novo ritmo dela. Nas caminhadas, parei de olhar o relógio. A gente ia no tempo dela. Às vezes sentávamos no meio do caminho só para ela ficar olhando as folhas se mexendo.',
  'https://picsum.photos/seed/fridis-cronica2/1440/900',
  '2021-03-10',
  'Velhice',
  'Nostalgico',
  true,
  4,
  now() - interval '4 months',
  now() - interval '4 months'
),

(
  '00000000-0000-0000-0000-000000000022',
  '00000000-0000-0000-0000-000000000002',
  'O que a saudade me ensinou',
  'Nos primeiros dias depois que a Fridis foi, eu andava pela casa esperando ouvi-la.

O barulho das unhas no piso. O som do bebedouro. O farfalhar quando ela sacudia as orelhas. Eu ouvia tudo isso e então lembrava — e a ausência chegava de novo, como uma onda que você pensa que passou mas não passou.

Chorei de formas que não sabia que existiam. Chorei no supermercado quando vi a embalagem da ração. Chorei no semáforo sem motivo aparente. Chorei de madrugada, sem conseguir dormir, olhando para o lugar onde ela dormia.

Um amigo me perguntou, algumas semanas depois, se eu não estava "exagerando". Que era só um cachorro.

Eu não respondi. Não valia a pena.

Quem já amou de verdade sabe que a dor não é proporcional à espécie. É proporcional ao vínculo. E o vínculo que eu tinha com a Fridis era um dos mais honestos da minha vida. Sem agenda. Sem condição. Sem ego. Ela me amava por completo e eu a amava por completo, e isso é raro — mais raro do que a maioria das pessoas admite.

A saudade foi me ensinando devagar.

Primeiro, que a dor é o amor que não tem mais para onde ir. Então ela fica circulando dentro da gente, batendo nas paredes, procurando saída. Esse espaço — este memorial — foi uma forma de dar um lugar para ela ir.

Segundo, que guardar memórias não é se prender ao passado. É honrar o que foi real. Cada foto, cada crônica, cada momento que escrevi aqui foi um ato de gratidão, não de negação.

Terceiro — e esse levou mais tempo — que ela não foi embora sem deixar nada. Ela me deixou treze anos de manhãs melhores. Me deixou a capacidade de amar sem reservas. Me deixou um ritmo mais lento e mais atento para a vida.

A Fridis não está mais aqui. Mas o que ela plantou em mim ainda está crescendo.

E isso, eu acho, é o que significa ser eterno.',
  'A dor é o amor que não tem mais para onde ir. Então ela fica circulando dentro da gente, batendo nas paredes, procurando saída. Este memorial foi uma forma de dar um lugar para ela ir.',
  'https://picsum.photos/seed/fridis-cronica3/1440/900',
  '2023-10-15',
  'Depois da saudade',
  'Reflexivo',
  true,
  5,
  now() - interval '2 months',
  now() - interval '2 months'
)

ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 5. Tributos aprovados (5)
-- -----------------------------------------------------------------------------

INSERT INTO tributes (
  id, pet_id, author_name, author_relation, author_user_id,
  message, status, reviewed_at, created_at
) VALUES

(
  '00000000-0000-0000-0000-000000000030',
  '00000000-0000-0000-0000-000000000002',
  'Ana Paula Ramos',
  'Amiga da família',
  null,
  'A Fridis era especial de um jeito que só quem a conheceu pessoalmente consegue entender. Toda vez que eu chegava na casa da Maria Clara, ela vinha me receber como se eu fosse a pessoa mais importante do mundo. Vou sentir falta disso para sempre. Obrigada por tudo, Fridis.',
  'approved',
  now() - interval '60 days',
  now() - interval '65 days'
),

(
  '00000000-0000-0000-0000-000000000031',
  '00000000-0000-0000-0000-000000000002',
  'Dr. Rodrigo Almeida',
  'Veterinário',
  null,
  'Acompanhei a Fridis nos últimos quatro anos de vida. Era uma paciente tranquila, corajosa e — posso dizer com segurança — muito amada. Poucos animais chegam ao consultório com tanta serenidade. Ela foi bem cuidada e viveu com qualidade até o fim. É o máximo que podemos desejar para eles.',
  'approved',
  now() - interval '55 days',
  now() - interval '58 days'
),

(
  '00000000-0000-0000-0000-000000000032',
  '00000000-0000-0000-0000-000000000002',
  'Letícia Borges',
  'Vizinha',
  null,
  'Eu me lembro da Fridis chegando filhote naquele apartamento. Parecia impossível que aquela bolinha branca e preta fosse crescer tanto — em tamanho e em personalidade. Ela animava o corredor inteiro do prédio. Cada vez que eu a encontrava no elevador era garantia de um dia melhor.',
  'approved',
  now() - interval '45 days',
  now() - interval '48 days'
),

(
  '00000000-0000-0000-0000-000000000033',
  '00000000-0000-0000-0000-000000000002',
  'Família Andrade',
  'Família',
  null,
  'Em nome de toda a família, queremos deixar nosso carinho. A Fridis esteve em tantos dos nossos momentos — festas, fins de semana, visitas de domingo. Era impossível não amá-la. Maria Clara, você foi uma tutora incrível. Ela viveu uma vida linda porque você soube dar isso a ela.',
  'approved',
  now() - interval '40 days',
  now() - interval '42 days'
),

(
  '00000000-0000-0000-0000-000000000034',
  '00000000-0000-0000-0000-000000000002',
  'Sofia (9 anos)',
  'Amiguinha',
  null,
  'Eu amava a Fridis muito. Ela me lambeu o rosto quando eu estava triste um dia e eu nunca esqueci. Espero que ela esteja brincando em algum lugar muito bonito.',
  'approved',
  now() - interval '30 days',
  now() - interval '32 days'
)

ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 6. Reação (1 coração do demo user)
-- -----------------------------------------------------------------------------

INSERT INTO memorial_reactions (
  id, pet_id, user_id, reaction_type, created_at
) VALUES (
  '00000000-0000-0000-0000-000000000040',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'heart',
  now()
) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Concluído. Acesse /memorial/fridis para ver o resultado.
-- =============================================================================
