import { redirect } from 'next/navigation';

// Mantém links salvos da área anterior sem manter dois fluxos de contrato.
export default function LegacyContractsPage() {
  redirect('/admin/comercial/contratos');
}
