import OrderDetailClient from "./OrderDetailClient";

// Server component
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <OrderDetailClient orderId={id} />;
}
