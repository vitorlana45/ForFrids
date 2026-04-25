import { Resend } from 'resend';

const resend = new Resend('re_KWp1rjyq_AKSSMYCmDSYnekCHYakTfyz7');

const SITE_URL = 'http://localhost:3000';

function welcomeEmail(name) {
  const firstName = name.split(' ')[0];
  return {
    subject: 'Bem-vindo ao Eterno Pet 🌿',
    html: `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fdfbf7;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(74,101,79,0.08);">
        <tr><td style="background:#4a654f;padding:40px 48px;text-align:center;">
          <p style="margin:0;font-family:Georgia,serif;font-size:28px;font-style:italic;color:#fdfbf7;">Eterno Pet</p>
        </td></tr>
        <tr><td style="padding:48px 48px 32px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#7a9c7e;">Boas-vindas</p>
          <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:36px;color:#1c1f1d;">Olá, ${firstName}</h1>
          <p style="margin:0 0 20px;font-size:17px;color:#4a5568;line-height:1.7;">
            Ficamos felizes em ter você aqui. O Eterno Pet é um santuário digital para celebrar a vida do seu companheiro — com carinho, memória e beleza.
          </p>
          <p style="margin:0 0 32px;font-size:17px;color:#4a5568;line-height:1.7;">
            Você já pode criar o primeiro memorial, registrar momentos na linha do tempo e compartilhar o link com quem você ama.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:40px;">
            <tr><td style="border-radius:100px;background:#4a654f;">
              <a href="${SITE_URL}/dashboard" style="display:inline-block;padding:16px 40px;font-family:Georgia,serif;font-size:16px;font-weight:600;color:#fdfbf7;text-decoration:none;border-radius:100px;">
                Ir para o meu memorial →
              </a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 48px 40px;text-align:center;border-top:1px solid #f0ebe4;">
          <p style="margin:0;font-family:Georgia,serif;font-style:italic;font-size:14px;color:#9ca3af;">
            "Cada memória guardada é uma forma de amor que nunca termina."
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}

const { subject, html } = welcomeEmail('Vitor Lana');

const { data, error } = await resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'vitoresmerio00@gmail.com',
  subject,
  html,
});

if (error) {
  console.error('Erro:', error);
} else {
  console.log('✓ E-mail enviado. ID:', data.id);
}
