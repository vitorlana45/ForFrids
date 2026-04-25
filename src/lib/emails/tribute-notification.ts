const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eternopet.com.br';

interface TributeNotificationData {
  ownerName: string;
  petName: string;
  petSlug: string;
  authorName: string;
  authorRelation: string | null;
  message: string;
}

export function tributeNotificationEmail(data: TributeNotificationData): {
  subject: string;
  html: string;
} {
  const { ownerName, petName, petSlug, authorName, authorRelation, message } = data;
  const firstName = ownerName.split(' ')[0];
  const dashboardUrl = `${SITE_URL}/dashboard/pets/${petSlug}/editar`;
  const relation = authorRelation ? ` · ${authorRelation}` : '';

  return {
    subject: `${authorName} deixou uma homenagem para ${petName}`,
    html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nova homenagem para ${petName}</title>
</head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fdfbf7;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(74,101,79,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#4a654f;padding:40px 48px;text-align:center;">
              <p style="margin:0;font-family:Georgia,serif;font-size:28px;font-style:italic;color:#fdfbf7;letter-spacing:0.02em;">
                Eterno Pet
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px 48px 32px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#7a9c7e;">
                Nova homenagem
              </p>
              <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:32px;color:#1c1f1d;line-height:1.2;">
                Olá, ${firstName}
              </h1>
              <p style="margin:0 0 32px;font-size:17px;color:#4a5568;line-height:1.7;">
                <strong>${authorName}</strong> enviou uma homenagem para o memorial de <strong>${petName}</strong>. Ela aguarda a sua aprovação antes de aparecer na página pública.
              </p>

              <!-- Tribute card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:36px;border-radius:16px;background:#f5f0eb;overflow:hidden;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 16px;font-family:Georgia,serif;font-size:18px;font-style:italic;color:#1c1f1d;line-height:1.7;">
                      "${message}"
                    </p>
                    <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#7a9c7e;">
                      ${authorName}${relation}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td style="border-radius:100px;background:#4a654f;">
                    <a href="${dashboardUrl}#homenagens" style="display:inline-block;padding:16px 40px;font-family:Georgia,serif;font-size:16px;font-weight:600;color:#fdfbf7;text-decoration:none;border-radius:100px;">
                      Revisar homenagem →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;color:#9ca3af;">
                Você pode aprovar ou recusar direto no painel do pet.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 48px 40px;text-align:center;border-top:1px solid #f0ebe4;">
              <p style="margin:0;font-family:Georgia,serif;font-style:italic;font-size:14px;color:#9ca3af;">
                "Cada homenagem é um pedaço de carinho que permanece para sempre."
              </p>
              <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">
                Eterno Pet · <a href="${SITE_URL}" style="color:#7a9c7e;text-decoration:none;">${SITE_URL}</a>
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
