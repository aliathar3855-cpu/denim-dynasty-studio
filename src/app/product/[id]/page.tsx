import { getProductById } from "@/lib/products";
import ProductPageClient from "./ProductPageClient";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await getProductById(resolvedParams.id);
  if (!product) {
    return {
      title: "Product Not Found | Denim Dynasty Studio",
      description: "Curated streetwear collection for modern trendsetters",
    };
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : [product.imageUrl || "/placeholder-product.png"];

  return {
    title: `${product.name} | Denim Dynasty Studio`,
    description: product.description.slice(0, 150),
    openGraph: {
      title: `${product.name} | Denim Dynasty Studio`,
      description: product.description.slice(0, 150),
      images: [
        {
          url: images[0],
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const product = await getProductById(resolvedParams.id);

  if (!product) {
    return (
      <main className="min-h-screen bg-white text-[#111111] flex items-center justify-center">
        <h1 className="text-3xl font-bold">Product Not Found</h1>
      </main>
    );
  }

  // Generate structured JSON-LD schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.images && product.images.length > 0 ? product.images[0] : (product.imageUrl || ""),
    "description": product.description,
    "sku": product.id,
    "brand": {
      "@type": "Brand",
      "name": "Denim Dynasty Studio"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://denim-dynasty-studio.vercel.app/product/${product.id}`,
      "priceCurrency": "INR",
      "price": product.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.stockStatus === "OUT_OF_STOCK" 
        ? "https://schema.org/OutOfStock" 
        : "https://schema.org/InStock"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductPageClient product={product as any} />
    </>
  );
}
