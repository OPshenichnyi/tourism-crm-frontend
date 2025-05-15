import OrderDetailClient from "./OrderDetailClient";

interface PageProps {
  params: { id: string };
}

export default function OrderDetailPage({ params }: PageProps) {
  return <OrderDetailClient orderId={params.id} />;
}
