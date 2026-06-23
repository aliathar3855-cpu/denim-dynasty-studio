import { Metadata } from "next";
import { notFound } from "next/navigation";

import { getProductById } from "@/lib/products";
import ProductPageClient from "./ProductPageClient";

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return {
      title: "Product Not Found | Denim Dynasty Studio",
      description:
        "Curated streetwear collection for modern trendsetters.",
    };
  }

  const images =
    product.images && product.images.length > 0
      ? product.images
      : [product.imageUrl || "/placeholder-product.png"];

  return {
    title: `${product.name} | Denim Dynasty Studio`,
    description: product.description?.slice(0, 150),

    openGraph: {
      title: `${product.name} | Denim Dynasty Studio`,
      description: product.description?.slice(0, 150),
      images: [
        {
          url: images[0],
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: `${product.name} | Denim Dynasty Studio`,
      description: product.description?.slice(0, 150),
      images: [images[0]],
    },
  };
}

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { id } = await params;

  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const productImage =
    product.images && product.images.length > 0
      ? product.images[0]
      : product.imageUrl || "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",

    name: product.name,
    image: productImage,
    description: product.description,
    sku: product.id,

    brand: {
      "@type": "Brand",
      name: "Denim Dynasty Studio",
    },

    offers: {
      "@type": "Offer",
      url: `https://denim-dynasty-studio.vercel.app/product/${product.id}`,
      priceCurrency: "INR",
      price: product.price,
      itemCondition: "https://schema.org/NewCondition",
      availability:
        product.stockStatus === "OUT_OF_STOCK"
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
    },
  };
   const serializedProduct = {
       ...product,
    createdAt: product.createdAt
     ? {
          seconds: product.createdAt.seconds,
          nanoseconds: product.createdAt.nanoseconds,
        }
      : null,
    };


  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      <ProductPageClient product={serializedProduct} />
    </>
  );
}