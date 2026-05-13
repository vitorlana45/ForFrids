interface WelcomeEmailInput {
  name: string;
  siteUrl: string;
}

interface ReminderEmailInput {
  tutorName: string;
  petName: string;
  dateLabel: string;
  memorialUrl: string;
}

interface BirthdayEmailInput {
  tutorName: string;
  petName: string;
  memorialUrl: string;
  ageYears?: number | null;
}

interface AnniversaryEmailInput {
  tutorName: string;
  petName: string;
  memorialUrl: string;
  yearsSince?: number | null;
}

export function welcomeEmail({ name, siteUrl }: WelcomeEmailInput) {
  return {
    subject: 'Bem-vindo ao Eterno Pet',
    html: `
      <div style="font-family: Manrope, Arial, sans-serif; color: #1e1b18; line-height: 1.6;">
        <h1 style="font-family: Georgia, serif; color: #4a654f;">Bem-vindo, ${name}</h1>
        <p>Seu santuario de memorias esta pronto para receber historias, fotos e homenagens.</p>
        <p><a href="${siteUrl}/dashboard" style="color: #4a654f; font-weight: 700;">Abrir meu painel</a></p>
      </div>
    `,
  };
}

export function petDateReminderEmail({
  tutorName,
  petName,
  dateLabel,
  memorialUrl,
}: ReminderEmailInput) {
  return {
    subject: `🌿 ${dateLabel} — Eterno Pet`,
    html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fdfbf7;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(74,101,79,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#4a654f;padding:40px 48px;text-align:center;">
              <p style="margin:0;font-family:Georgia,serif;font-size:28px;font-style:italic;color:#fdfbf7;letter-spacing:0.02em;">Eterno Pet</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px 48px 40px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#7a9c7e;">
                Lembrete especial
              </p>
              <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:32px;color:#1c1f1d;line-height:1.2;">
                ${dateLabel}
              </h1>
              <p style="margin:0 0 16px;font-size:17px;color:#4a5568;line-height:1.7;">
                Oi, ${tutorName}. Hoje é uma data especial para lembrar de ${petName}.
              </p>
              <p style="margin:0 0 32px;font-size:17px;color:#4a5568;line-height:1.7;">
                Que tal acender uma vela digital, reler uma crônica ou simplesmente visitar o memorial e deixar o amor fluir?
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:40px;">
                <tr>
                  <td style="border-radius:100px;background:#4a654f;">
                    <a href="${memorialUrl}" style="display:inline-block;padding:16px 40px;font-family:Georgia,serif;font-size:16px;font-weight:600;color:#fdfbf7;text-decoration:none;border-radius:100px;">
                      Visitar memorial de ${petName} →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Decorative quote -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7f5;border-radius:12px;padding:20px 24px;">
                <tr>
                  <td>
                    <p style="margin:0;font-family:Georgia,serif;font-style:italic;font-size:16px;color:#4a654f;line-height:1.6;">
                      "As memórias são o único jardim que nenhuma estação pode destruir."
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 48px 40px;text-align:center;border-top:1px solid #f0ebe4;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Eterno Pet · <a href="https://eternopet.com.br" style="color:#7a9c7e;text-decoration:none;">eternopet.com.br</a>
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#b0b7bf;">
                Você recebeu este e-mail porque tem um memorial ativo no Eterno Pet.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };
}

function buildEmail({
  badge,
  title,
  greeting,
  body,
  ctaLabel,
  ctaUrl,
  quote,
  subject,
}: {
  badge: string;
  title: string;
  greeting: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  quote: string;
  subject: string;
}) {
  return {
    subject,
    html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fdfbf7;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(74,101,79,0.08);">
          <tr>
            <td style="background:#4a654f;padding:40px 48px;text-align:center;">
              <p style="margin:0;font-family:Georgia,serif;font-size:28px;font-style:italic;color:#fdfbf7;letter-spacing:0.02em;">Eterno Pet</p>
            </td>
          </tr>
          <tr>
            <td style="padding:48px 48px 40px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#7a9c7e;">
                ${badge}
              </p>
              <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:32px;color:#1c1f1d;line-height:1.2;">
                ${title}
              </h1>
              <p style="margin:0 0 16px;font-size:17px;color:#4a5568;line-height:1.7;">
                ${greeting}
              </p>
              <p style="margin:0 0 32px;font-size:17px;color:#4a5568;line-height:1.7;">
                ${body}
              </p>
              <table cellpadding="0" cellspacing="0" style="margin-bottom:40px;">
                <tr>
                  <td style="border-radius:100px;background:#4a654f;">
                    <a href="${ctaUrl}" style="display:inline-block;padding:16px 40px;font-family:Georgia,serif;font-size:16px;font-weight:600;color:#fdfbf7;text-decoration:none;border-radius:100px;">
                      ${ctaLabel}
                    </a>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7f5;border-radius:12px;padding:20px 24px;">
                <tr>
                  <td>
                    <p style="margin:0;font-family:Georgia,serif;font-style:italic;font-size:16px;color:#4a654f;line-height:1.6;">
                      "${quote}"
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 48px 40px;text-align:center;border-top:1px solid #f0ebe4;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Eterno Pet · <a href="https://eternopet.com.br" style="color:#7a9c7e;text-decoration:none;">eternopet.com.br</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };
}

export function petBirthdayEmail({ tutorName, petName, memorialUrl, ageYears }: BirthdayEmailInput) {
  const ageLine = ageYears && ageYears > 0
    ? `Hoje ${petName} completaria ${ageYears} ${ageYears === 1 ? 'ano' : 'anos'}.`
    : `Hoje é aniversário de ${petName}.`;
  return buildEmail({
    badge: 'Aniversário especial',
    title: `🌸 Feliz aniversário, ${petName}`,
    greeting: `Oi, ${tutorName}. ${ageLine}`,
    body: 'Que tal celebrar acrescentando uma crônica nova, escolhendo uma foto favorita para a galeria, ou apenas reler as memórias que vocês construíram juntos?',
    ctaLabel: `Celebrar com ${petName} →`,
    ctaUrl: memorialUrl,
    quote: 'O amor que cultivamos junto deles não envelhece — só amadurece.',
    subject: `🌸 Aniversário de ${petName} — Eterno Pet`,
  });
}

interface MemorialBlockedEmailInput {
  tutorName: string;
  petName: string;
  reason: string;
  dashboardUrl: string;
  supportEmail: string;
}

export function memorialBlockedEmail({
  tutorName,
  petName,
  reason,
  dashboardUrl,
  supportEmail,
}: MemorialBlockedEmailInput) {
  return buildEmail({
    badge: 'Aviso de moderação',
    title: `Memorial de ${petName} foi bloqueado`,
    greeting: `Oi, ${tutorName}. Identificamos que o memorial de ${petName} contém conteúdo que viola as diretrizes do Eterno Pet.`,
    body: `Motivo informado pela equipe: "${reason}". O memorial não está mais acessível publicamente. Seus dados continuam preservados — nada foi deletado.`,
    ctaLabel: 'Abrir o painel',
    ctaUrl: dashboardUrl,
    quote: `Se você acredita que houve um erro, responda este e-mail ou escreva para ${supportEmail} para contestar a decisão.`,
    subject: `Memorial de ${petName} bloqueado — Eterno Pet`,
  });
}

export function petAnniversaryEmail({ tutorName, petName, memorialUrl, yearsSince }: AnniversaryEmailInput) {
  const yearsLine = yearsSince && yearsSince > 0
    ? `Faz ${yearsSince} ${yearsSince === 1 ? 'ano' : 'anos'} desde a partida de ${petName}.`
    : `Hoje é o dia de lembrar ${petName} com cuidado.`;
  return buildEmail({
    badge: 'Dia de lembrança',
    title: `🕊️ Lembrando ${petName}`,
    greeting: `Oi, ${tutorName}. ${yearsLine}`,
    body: 'Datas como hoje pedem espaço para o silêncio e para a presença. Se quiser, visite o memorial, acenda uma vela digital, ou simplesmente reveja uma memória que ainda aquece.',
    ctaLabel: `Visitar memorial de ${petName} →`,
    ctaUrl: memorialUrl,
    quote: 'Quem partiu continua morando em quem fica.',
    subject: `🕊️ Lembrando ${petName} — Eterno Pet`,
  });
}
