import { SupplierDetailPage } from "@/components/pages/supplier-detail";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SupplierDetailPage id={id} />;
}
