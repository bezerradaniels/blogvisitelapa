import AdvertiserForm from '@/features/contacts/AdvertiserForm';
import { siteConfig } from '@/lib/config/site';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'Anuncie no Conecta Lapa',
  description: `Anuncie para moradores, romeiros e visitantes de ${siteConfig.geo.city}. Banners, posts e eventos patrocinados e pacotes personalizados.`,
  path: '/anuncie',
});

const formats = [
  { title: 'Banners', desc: 'Espaços na home, nas laterais e dentro das matérias.' },
  { title: 'Posts patrocinados', desc: 'Publieditoriais que contam a história do seu negócio.' },
  { title: 'Eventos patrocinados', desc: 'Destaque para o seu evento na agenda da cidade.' },
  { title: 'Guias locais', desc: 'Presença nas seções de onde comer, malhar e hospedagem.' },
  { title: 'Pacotes personalizados', desc: 'Combinações sob medida para o seu objetivo.' },
];

export default function AnunciePage() {
  return (
    <div className="container-page py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h1 className="text-2xl font-extrabold text-title md:text-3xl">
            Anuncie no {siteConfig.name}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Conecte sua marca a moradores, romeiros e visitantes de {siteConfig.geo.city}. Oferecemos
            diversos formatos para o seu negócio se destacar na cidade.
          </p>
          <ul className="mt-6 space-y-3">
            {formats.map((f) => (
              <li key={f.title} className="card-base p-4">
                <h2 className="text-sm font-bold text-title">{f.title}</h2>
                <p className="text-sm text-muted">{f.desc}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-base h-fit p-5">
          <h2 className="text-lg font-bold text-title">Fale com o comercial</h2>
          <p className="mb-4 text-sm text-muted">
            Preencha os dados e retornaremos com as melhores opções para você.
          </p>
          <AdvertiserForm />
        </div>
      </div>
    </div>
  );
}
