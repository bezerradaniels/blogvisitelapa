import { redirect } from 'next/navigation';
import Button from '@/components/Button';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { buildMetadata } from '@/lib/seo/metadata';
import { formatDate, titleCase } from '@/lib/utils/format';

export const metadata = buildMetadata({ title: 'Meu perfil social', path: '/rede/perfil', noindex: true });

export default async function RedePerfilPage() {
  const user = await getCurrentUser();
  if (!user?.profile) redirect('/login-rede-social?redirect=/rede/perfil');
  const supabase = await createClient();
  const { data: details } = await supabase.from('profile_details').select('*').eq('profile_id', user.profile.id).maybeSingle();
  const rows = [
    ['Nome', titleCase(user.profile.full_name)],
    ['Apelido', details?.nickname],
    ['Cidade', details?.city],
    ['Relacionamento', details?.relationship],
    ['Aniversário', details?.birth_date ? formatDate(details.birth_date, "d 'de' MMMM") : null],
    ['Interesses', details?.interests],
    ['Quem sou eu', details?.about ?? user.profile.bio],
  ].filter((row): row is [string, string] => Boolean(row[1]));
  return (
    <section className="card-base overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4 sm:p-6">
        <h1 className="text-2xl font-extrabold text-title">Meu perfil</h1>
        <div className="flex flex-wrap gap-2">
          {user.profile.slug && <Button href={`/u/${user.profile.slug}`} size="sm" variant="outline">Ver perfil público</Button>}
          <Button href="/perfil" size="sm">Editar perfil</Button>
        </div>
      </div>
      <dl className="p-4 sm:p-6">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-1 border-b border-line py-3 last:border-0 sm:grid-cols-[160px_1fr]">
            <dt className="text-xs font-bold text-muted">{label}</dt>
            <dd className="whitespace-pre-wrap text-sm text-body">{value}</dd>
          </div>
        ))}
      </dl>
      {rows.length === 0 && <p className="px-6 pb-6 text-sm text-muted">Complete seu perfil para mostrar mais sobre você.</p>}
    </section>
  );
}
