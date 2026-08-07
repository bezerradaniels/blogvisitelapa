import AdminPageHeader from '@/components/AdminPageHeader';
import { adInventory } from '@/lib/config/adInventory';

const statusLabel = { implemented: 'Disponível', placeholder: 'Placeholder', planned: 'Planejado' } as const;

export default function AdvertisingSpacesPage() {
  return <div className="admin-page space-y-4">
    <AdminPageHeader title="Espaços publicitários" description="Inventário dos locais comerciais do portal, com identificação, páginas, formatos e capacidade." />
    <div className="admin-notice"><strong>Placeholders de identificação ativos.</strong> Quando não houver campanha publicada, os espaços implantados exibem seu nome, código e dimensões.</div>
    <section className="admin-table-wrap">
      <table className="admin-table min-w-[1100px]">
        <thead><tr><th>Nome</th><th>Código</th><th>Local</th><th>Páginas</th><th>Desktop</th><th>Mobile</th><th>Capacidade</th><th>Status</th></tr></thead>
        <tbody>{adInventory.map((item) => <tr key={item.code}><td className="font-semibold text-title">{item.name}</td><td><code>{item.code}</code></td><td>{item.location}</td><td>{item.pages}</td><td>{item.desktop}</td><td>{item.mobile}</td><td>{item.capacity}</td><td>{statusLabel[item.status]}</td></tr>)}</tbody>
      </table>
    </section>
    <p className="admin-help">“Planejado” indica um código já cadastrado comercialmente, mas ainda sem ponto visual conectado ao portal.</p>
  </div>;
}
