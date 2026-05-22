import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Advisory from "@/components/landing/Advisory";
import Destinations from "@/components/landing/Destinations";
import Footer from "@/components/landing/Footer";

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
