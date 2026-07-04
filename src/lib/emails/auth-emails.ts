const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eternopet.com.br';

function emailShell(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fdfbf7;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(74,101,79,0.08);">
        <tr><td style="background:#4a654f;padding:40px 48px;text-align:center;">
          <p style="margin:0;font-family:Georgia,serif;font-size:28px;font-style:italic;color:#fdfbf7;letter-spacing:0.02em;">Eterno Pet</p>
        </td></tr>
        <tr><td style="padding:48px 48px 32px;">${bodyHtml}</td></tr>
        <tr><td style="padding:24px 48px 40px;text-align:center;border-top:1px solid #f0ebe4;">
          <p style="margin:0;font-family:Georgia,serif;font-style:italic;font-size:14px;color:#9ca3af;">"Cada memória guardada é uma forma de amor que nunca termina."</p>
          <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">Eterno Pet · <a href="${SITE_URL}" style="color:#7a9c7e;text-decoration:none;">${SITE_URL}</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function verificationEmail(url: string): { subject: string; html: string } {
  return {
    subject: 'Confirme seu email — Eterno Pet',
    html: emailShell('Confirme seu email', `
      <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:32px;color:#1c1f1d;line-height:1.2;">Confirme seu e-mail</h1>
      <p style="margin:0 0 20px;font-size:17px;color:#4a5568;line-height:1.7;">
        Clique no botão abaixo para confirmar seu e-mail e começar a usar o Eterno Pet.
      </p>
      <table cellpadding="0" cellspacing="0" style="margin:32px 0;"><tr>
        <td style="border-radius:100px;background:#4a654f;">
          <a href="${url}" style="display:inline-block;padding:16px 40px;font-family:Georgia,serif;font-size:16px;font-weight:600;color:#fdfbf7;text-decoration:none;border-radius:100px;">Confirmar e-mail</a>
        </td>
      </tr></table>
      <p style="margin:0;font-size:14px;color:#9ca3af;line-height:1.6;">
        Se você não criou uma conta no Eterno Pet, pode ignorar este e-mail com segurança.
      </p>`),
  };
}

export function passwordResetEmail(url: string): { subject: string; html: string } {
  return {
    subject: 'Redefinir senha — Eterno Pet',
    html: emailShell('Redefinir senha', `
      <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:32px;color:#1c1f1d;line-height:1.2;">Redefinir sua senha</h1>
      <p style="margin:0 0 20px;font-size:17px;color:#4a5568;line-height:1.7;">
        Recebemos um pedido para redefinir a senha da sua conta. Clique no botao abaixo para criar uma nova senha.
      </p>
      <table cellpadding="0" cellspacing="0" style="margin:32px 0;"><tr>
        <td style="border-radius:100px;background:#4a654f;">
          <a href="${url}" style="display:inline-block;padding:16px 40px;font-family:Georgia,serif;font-size:16px;font-weight:600;color:#fdfbf7;text-decoration:none;border-radius:100px;">Redefinir senha</a>
        </td>
      </tr></table>
      <p style="margin:0;font-size:14px;color:#9ca3af;line-height:1.6;">
        Se você não pediu para redefinir sua senha, pode ignorar este e-mail com segurança. Sua senha atual continua válida.
      </p>`),
  };
}
