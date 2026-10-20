import { LocationDetailPage } from "@/components/pages/locations";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LocationDetailPage id={id} />;
}
