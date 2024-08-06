import Link from "next/link";
import React from "react";

export default function Navbar() {
  return (
    <nav className="flex justify-between p-6 text-xl">
      <Link
        href="/"
        className="font-semibold text-2xl hover:text-gray-500 transition"
      >
        NOVA
      </Link>
      <div className="flex gap-6">
        <Link href="/compare" className="hover:text-gray-500 transition">
          Analyze
        </Link>
        <Link href="/how-to" className="hover:text-gray-500 transition">
          How To
        </Link>
        <p>MAROON</p>
      </div>
    </nav>
  );
}
