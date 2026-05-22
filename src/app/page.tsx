import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Advisory from "@/components/landing/Advisory";
import dynamic from "next/dynamic";

const Destinations = dynamic(() => import("@/components/landing/Destinations"));
const Footer = dynamic(() => import("@/components/landing/Footer"));

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        <Hero />
        <Advisory />
        <Destinations />
      </main>
      <Footer />
    </>
  );
}
