import { redirect } from 'next/navigation';

export default function LegacyNewContractPage() {
  redirect('/admin/comercial/contratos/novo');
}
