import 'server-only';

// Envio de e-mails transacionais via API do Resend (sem SDK, usando fetch).
// Configuração por ambiente:
//   RESEND_API_KEY  -> chave da API do Resend (obrigatória para enviar)
//   EMAIL_FROM      -> remetente, ex.: "Conecta Lapa <nao-responda@conectalapa.com.br>"
// Sem a chave, o envio é ignorado silenciosamente (no-op) para nunca quebrar o fluxo.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const DEFAULT_FROM = 'Conecta Lapa <nao-responda@conectalapa.com.br>';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export interface SendEmailResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Sem chave configurada: não é um erro fatal, apenas não envia.
    console.warn('[email] RESEND_API_KEY ausente — e-mail não enviado.');
    return { ok: false, skipped: true };
  }

  const from = process.env.EMAIL_FROM ?? DEFAULT_FROM;

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error(`[email] Resend respondeu ${res.status}: ${detail}`);
      return { ok: false, error: `Resend ${res.status}` };
    }

    return { ok: true };
  } catch (err) {
    console.error('[email] Falha ao chamar o Resend:', err);
    return { ok: false, error: 'network' };
  }
}
