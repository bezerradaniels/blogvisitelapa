import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

// Rota legada preservada para links salvos. O detalhe comercial novo concentra
// itens, campanhas, parcelas, arquivos e histórico em uma única tela.
export default async function LegacyContractDetailPage({ params }: Props) {
  const { id } = await params;
  redirect(`/admin/comercial/contratos/${id}`);
}
