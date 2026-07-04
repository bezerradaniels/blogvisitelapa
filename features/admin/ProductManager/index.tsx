'use client';

// Gestão de produtos avulsos: formulário (criar/editar) + lista.
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import StatusBadge from '@/components/StatusBadge';
import Textarea from '@/components/Textarea';
import { deleteProduct, saveProduct, type ProductInput } from '@/features/admin/productsActions';
import { formatCurrency } from '@/lib/utils/format';

interface ProductRow {
  id: string;
  product_name: string;
  description: string | null;
  price: number | null;
  company_name: string | null;
  payment_method: string | null;
  payment_status: string;
  delivery_status: string;
  notes: string | null;
}

const empty: ProductInput = {
  product_name: '', description: '', price: '', company_name: '', payment_method: '',
  payment_status: 'pendente', delivery_status: 'pendente', notes: '',
};

const pay = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'parcial', label: 'Parcial' },
  { value: 'pago', label: 'Pago' },
  { value: 'atrasado', label: 'Atrasado' },
  { value: 'cancelado', label: 'Cancelado' },
];
const delivery = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_producao', label: 'Em produção' },
  { value: 'entregue', label: 'Entregue' },
  { value: 'cancelado', label: 'Cancelado' },
];

export default function ProductManager({ products }: { products: ProductRow[] }) {
  const router = useRouter();
  const [form, setForm] = useState<ProductInput>(empty);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function edit(p: ProductRow) {
    setForm({
      id: p.id,
      product_name: p.product_name,
      description: p.description ?? '',
      price: p.price != null ? String(p.price) : '',
      company_name: p.company_name ?? '',
      payment_method: p.payment_method ?? '',
      payment_status: p.payment_status as ProductInput['payment_status'],
      delivery_status: p.delivery_status as ProductInput['delivery_status'],
      notes: p.notes ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function save() {
    setError(null);
    start(async () => {
      const res = await saveProduct(form);
      if (!res.ok) return setError(res.error ?? 'Erro.');
      setForm(empty);
      router.refresh();
    });
  }

  function remove(id: string) {
    start(async () => {
      await deleteProduct(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="card-base space-y-3 p-4">
        <span className="text-sm font-bold text-title">{form.id ? 'Editar produto' : 'Novo produto avulso'}</span>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Nome do produto" value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} placeholder="Ex.: Criação de arte" />
          <Input label="Preço (R$)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <Input label="Empresa/cliente" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
          <Input label="Forma de pagamento" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} />
          <Select label="Status do pagamento" value={form.payment_status} onChange={(e) => setForm({ ...form, payment_status: e.target.value as ProductInput['payment_status'] })} options={pay} />
          <Select label="Status de entrega" value={form.delivery_status} onChange={(e) => setForm({ ...form, delivery_status: e.target.value as ProductInput['delivery_status'] })} options={delivery} />
        </div>
        <Textarea label="Descrição" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Textarea label="Observações" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button onClick={save}>{pending ? 'Salvando...' : form.id ? 'Salvar' : 'Criar produto'}</Button>
          {form.id && <Button variant="ghost" onClick={() => setForm(empty)}>Cancelar</Button>}
        </div>
      </div>

      <div className="card-base overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs text-muted">
            <tr>
              <th className="p-3">Produto</th>
              <th className="p-3">Preço</th>
              <th className="p-3">Pagamento</th>
              <th className="p-3">Entrega</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {products.map((p) => (
              <tr key={p.id}>
                <td className="p-3">
                  <span className="font-medium text-title">{p.product_name}</span>
                  {p.company_name && <span className="block text-xs text-muted">{p.company_name}</span>}
                </td>
                <td className="p-3 text-muted">{formatCurrency(p.price)}</td>
                <td className="p-3"><StatusBadge status={p.payment_status} /></td>
                <td className="p-3 text-muted">{p.delivery_status}</td>
                <td className="p-3 text-right">
                  <button onClick={() => edit(p)} className="text-xs text-brand hover:underline">Editar</button>
                  <button onClick={() => remove(p.id)} className="ml-3 text-xs text-danger hover:underline">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
