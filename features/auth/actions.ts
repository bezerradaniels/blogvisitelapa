'use server';

// Server Actions de autenticação/segurança da conta.
import { renderPasswordChangedEmail } from '@/features/auth/emails/passwordChanged';
import { getCurrentUser } from '@/lib/auth/session';
import { absoluteUrl, siteConfig } from '@/lib/config/site';
import { sendEmail } from '@/lib/email/resend';

// Dispara o aviso "sua senha foi alterada" para o e-mail da conta logada.
// É best-effort: qualquer falha é registrada mas NUNCA quebra o fluxo de troca
// de senha (a senha já foi alterada quando esta ação é chamada).
export async function notifyPasswordChanged(): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (!user?.email) return;

    const datetime = new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'America/Bahia',
    })
      .format(new Date())
      .replace(',', ' às');

    const html = renderPasswordChangedEmail({
      email: user.email,
      datetime,
      resetUrl: absoluteUrl('/recuperar-senha'),
      supportEmail: siteConfig.contact.email,
    });

    await sendEmail({
      to: user.email,
      subject: 'Sua senha foi alterada — Conecta Lapa',
      html,
      replyTo: siteConfig.contact.email,
    });
  } catch (err) {
    console.error('[auth] Falha ao enviar aviso de senha alterada:', err);
  }
}
