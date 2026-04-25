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
    subject: `Hoje e uma data especial de ${petName}`,
    html: `
      <div style="font-family: Manrope, Arial, sans-serif; color: #1e1b18; line-height: 1.6;">
        <h1 style="font-family: Georgia, serif; color: #4a654f;">${dateLabel}</h1>
        <p>Oi, ${tutorName}. Hoje pode ser um bom dia para revisitar uma lembranca de ${petName}.</p>
        <p><a href="${memorialUrl}" style="color: #4a654f; font-weight: 700;">Ver memorial</a></p>
      </div>
    `,
  };
}
