"use client";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "@/firebase/config";

export default function ProductPage() {

  const { id } = useParams();

  const [product, setProduct] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchProduct = async () => {

      try {

        if (!id) return;

        const docRef = doc(
          db,
          "products",
          id.toString()
        );

        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {

          setProduct({
            id: snapshot.id,
            ...snapshot.data(),
          });

        }

      } catch (error) {

        console.error(error);

      } finally {

        setLoading(false);

      }

    };

    fetchProduct();

  }, [id]);

  if (loading) {

    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <h1 className="text-3xl font-bold">
          Loading Product...
        </h1>
      </main>
    );

  }

  if (!product) {

    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <h1 className="text-3xl font-bold">
          Product Not Found
        </h1>
      </main>
    );

  }

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-10">

      <div className="grid md:grid-cols-2 gap-10">

        <div>

          <img
            src={product.imageUrl}
            alt={product.name}
            className="