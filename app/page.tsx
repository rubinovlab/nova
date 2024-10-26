"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="p-20">
      <p className="text-6xl text-center font-bold mb-4">NOVA</p>
      <p className="text-center text-3xl mb-10">
        Visualize your GWAS & TWAS data!
      </p>
      <p className="text-xl font-light mx-20">
        Neuro Omics Visual Analytics (NOVA) is a tool that visualizes GWAS and
        TWAS data with various graphs and filters. Start analyzing{" "}
        <span
          className="underline hover:text-gray-500 transition cursor-pointer"
          onClick={() => router.push("/compare")}
        >
          here
        </span>
        .
      </p>
    </div>
  );
}
