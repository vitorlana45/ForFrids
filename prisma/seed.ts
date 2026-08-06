import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const OWNER_EMAIL = 'demo@eternopet.com.br';
const PET_SLUG = 'max';

const LETTER = `Meu Max,

Doze anos não foram suficientes. Você chegou pequenininho, cabendo em uma mão, e foi crescendo junto com a nossa família — em cada trilha, cada verão na praia, cada tarde de preguiça no sol.

Obrigado por esperar na porta todos os dias, por entender os dias tristes sem precisar de palavras, por ensinar a gente o que é amar sem pedir nada em troca.

A casa ficou grande demais sem o som das suas patas. Mas em cada canto ainda tem um pedacinho de você.

Vai com a gente pra sempre, meu amigo.`;

async function main() {
  const owner = await prisma.profile.upsert({
    where: { email: OWNER_EMAIL },
    update: {
      full_name: 'Família do Max',
      guardian_title: 'Guardiões das memórias do Max',
      plan_id: 'premium',
    },
    create: {
      email: OWNER_EMAIL,
      emailVerified: true,
      name: 'Família do Max',
      full_name: 'Família do Max',
      guardian_title: 'Guardiões das memórias do Max',
      bio: 'A família que teve a sorte de caminhar ao lado do Max por doze anos.',
      plan_id: 'premium',
    },
  });

  const pet = await prisma.pet.upsert({
    where: { memorial_slug: PET_SLUG },
    update: {
      owner_id: owner.id,
      name: 'Max',
      species: 'Cachorro',
      breed: 'Golden Retriever',
      birth_date: new Date('2012-05-10'),
      death_date: new Date('2024-08-01'),
      avatar_url: '/max_hero.jpg',
      avatar_position: '50% 25%',
      is_public: true,
      tribute_text:
        'O melhor companheiro de trilhas e o dono do latido mais alegre do bairro. Você nos ensinou o significado de amor incondicional.',
      letter_content: LETTER,
      letter_is_public: true,
      letter_updated_at: new Date(),
      letter_signature_text: 'Sempre seus, mamãe e papai',
      letter_signature_drawing: null,
    },
    create: {
      owner_id: owner.id,
      memorial_slug: PET_SLUG,
      name: 'Max',
      species: 'Cachorro',
      breed: 'Golden Retriever',
      birth_date: new Date('2012-05-10'),
      death_date: new Date('2024-08-01'),
      avatar_url: '/max_hero.jpg',
      avatar_position: '50% 25%',
      is_public: true,
      tribute_text:
        'O melhor companheiro de trilhas e o dono do latido mais alegre do bairro. Você nos ensinou o significado de amor incondicional.',
      letter_content: LETTER,
      letter_is_public: true,
      letter_updated_at: new Date(),
      letter_signature_text: 'Sempre seus, mamãe e papai',
    },
  });

  // Timeline (recriada a cada seed para manter o exemplo estável)
  await prisma.timelineEntry.deleteMany({ where: { pet_id: pet.id } });
  await prisma.timelineEntry.createMany({
    data: [
      {
        pet_id: pet.id,
        title: 'A chegada em casa',
        description:
          'O dia em que o Max chegou — pequeno o bastante pra caber numa mão e grande o bastante pra tomar conta de todos os corações.',
        date: new Date('2012-06-02'),
        photo_urls: ['/max.jpg'],
      },
      {
        pet_id: pet.id,
        title: 'Verões na praia',
        description: 'Correr atrás das ondas era o esporte favorito. Voltava pra casa cheio de areia e de alegria.',
        date: new Date('2016-01-15'),
        photo_urls: ['/max_out.jpg'],
      },
      {
        pet_id: pet.id,
        title: 'O melhor amigo',
        description: 'Companheiro de todas as horas — das trilhas de fim de semana às tardes tranquilas em casa.',
        date: new Date('2020-09-21'),
        photo_urls: ['/max_hero.jpg'],
      },
      {
        pet_id: pet.id,
        title: 'Até sempre, Max',
        description: 'Os últimos anos, mais lentos e serenos, sempre com o mesmo olhar doce de sempre.',
        date: new Date('2024-07-20'),
        photo_urls: ['/max_idoso.jpg'],
      },
    ],
  });

  // Tributos aprovados
  await prisma.tribute.deleteMany({ where: { pet_id: pet.id } });
  await prisma.tribute.createMany({
    data: [
      {
        pet_id: pet.id,
        author_name: 'Marina',
        author_relation: 'Vizinha',
        message:
          'O Max recebia todo mundo com o rabo abanando. Vou sentir saudade de encontrá-lo no portão. Um anjo de quatro patas.',
        status: 'approved',
        reviewed_at: new Date(),
      },
      {
        pet_id: pet.id,
        author_name: 'Bruno',
        author_relation: 'Amigo da família',
        message: 'Nunca vi um cachorro tão feliz numa trilha. Descansa, grandão — você foi muito amado.',
        status: 'approved',
        reviewed_at: new Date(),
      },
    ],
  });

  console.log(`Seed concluído: /memorial/${PET_SLUG} (dono ${owner.email}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
