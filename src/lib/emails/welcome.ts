const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eternopet.com.br';

export function welcomeEmail(name: string): { subject: string; html: string } {
  const firstName = name.split(' ')[0];

  return {
    subject: 'Bem-vindo ao Eterno Pet 🌿',
    html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bem-vindo ao Eterno Pet</title>
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
                Boas-vindas
              </p>
              <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:36px;color:#1c1f1d;line-height:1.2;">
                Olá, ${firstName}
              </h1>
              <p style="margin:0 0 20px;font-size:17px;color:#4a5568;line-height:1.7;">
                Ficamos felizes em ter você aqui. O Eterno Pet é um santuário digital para celebrar a vida do seu companheiro — com carinho, memória e beleza.
              </p>
              <p style="margin:0 0 32px;font-size:17px;color:#4a5568;line-height:1.7;">
                Você já pode criar o primeiro memorial, registrar momentos na linha do tempo e compartilhar o link com quem você ama.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:40px;">
                <tr>
                  <td style="border-radius:100px;background:#4a654f;">
                    <a href="${SITE_URL}/dashboard" style="display:inline-block;padding:16px 40px;font-family:Georgia,serif;font-size:16px;font-weight:600;color:#fdfbf7;text-decoration:none;border-radius:100px;">
                      Ir para o meu memorial →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Steps -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e8e0d8;padding-top:32px;">
                <tr>
                  <td style="padding:0 0 20px;">
                    <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#7a9c7e;">
                      Por onde começar
                    </p>
                  </td>
                </tr>
                ${[
                  ['Crie o perfil do seu pet', 'Nome, espécie, foto e uma homenagem em suas próprias palavras.'],
                  ['Adicione momentos à timeline', 'Fotos e descrições dos marcos da vida dele.'],
                  ['Compartilhe o memorial', 'Um link único para toda a família guardar.'],
                ]
                  .map(
                    ([title, desc], i) => `
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #f0ebe4;">
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="40" valign="top" style="padding-top:2px;">
                          <div style="width:28px;height:28px;border-radius:50%;background:#e8f0e9;display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-size:14px;font-weight:700;color:#4a654f;text-align:center;line-height:28px;">
                            ${i + 1}
                          </div>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#1c1f1d;">${title}</p>
                          <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.5;">${desc}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`,
                  )
                  .join('')}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 48px 40px;text-align:center;border-top:1px solid #f0ebe4;">
              <p style="margin:0;font-family:Georgia,serif;font-style:italic;font-size:14px;color:#9ca3af;">
                "Cada memória guardada é uma forma de amor que nunca termina."
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
