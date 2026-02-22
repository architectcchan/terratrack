import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ProductsPageContent } from "@/components/products/products-page-content";
import { ProductsSkeleton } from "@/components/products/products-skeleton";

async function ProductsData() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <ProductsPageContent />;
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsSkeleton />}>
      <ProductsData />
    </Suspense>
  );
}
