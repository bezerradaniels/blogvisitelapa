import ManualAdManager from '@/features/admin/ManualAdManager';
import { listManualPlacementStatuses } from '@/features/admin/manualAdQueries';

export const dynamic = 'force-dynamic';

export default async function ManualAdvertisingPage() {
  const placements = await listManualPlacementStatuses();
  return <ManualAdManager placements={placements} />;
}
