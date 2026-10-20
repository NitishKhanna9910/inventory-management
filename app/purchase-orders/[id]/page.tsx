import { PurchaseOrderDetailPage } from "@/components/pages/purchase-orders";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PurchaseOrderDetailPage id={id} />;
}
