"use client";

import dynamic from "next/dynamic";

const ManhattanPlot = dynamic(() => import("../components/Manhattan"), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="">
      <ManhattanPlot />
    </main>
  );
}
