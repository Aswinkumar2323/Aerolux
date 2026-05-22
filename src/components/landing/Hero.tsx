"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useFlightStore } from "@/store/useFlightStore";
import Image from "next/image";

export default function Hero() {
  const router = useRouter();
  const [tripType, setTripType] = useState<"round" | "one">("round");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [passengers, setPassengers] = useState("1");
  const [cabin, setCabin] = useState("economy");

  const { searchQuery, setSearchQuery } = useFlightStore();

  useEffect(() => {
    if (searchQuery) {
      setOrigin(searchQuery.origin || "");
      setDestination(searchQuery.destination || "");
      setDate(searchQuery.date || "");
      setPassengers(searchQuery.passengers || "1");
      setCabin(searchQuery.cabin || "economy");
    }
  }, [searchQuery]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const moveX = (e.clientX - window.innerWidth / 2) * 0.005;
      const moveY = (e.clientY - window.innerHeight / 2) * 0.005;
      setMousePos({ x: moveX, y: moveY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!origin || !destination || !date) return;

    setSearchQuery({
      origin,
      destination,
      date,
      passengers,
      cabin
    });

    const params = new URLSearchParams({
      origin,
      dest: destination,
      date,
      passengers,
      class: cabin
    });
    router.push(`/search?${params.toString()}`);
  };

  return (
    <section className="relative h-[870px] min-h-[600px] flex items-start pt-8 md:pt-16 justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-linear-to-b from-surface/20 via-surface/40 to-surface z-10"></div>
        <Image
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ transform: `scale(1.1) translate(${mousePos.x}px, ${mousePos.y}px)` }}
          alt="A cinematic, low-angle wide shot of a sleek modern jet airliner"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYqWatZbwS8_jxAZEb8oKeKHB4gterCOmYrbJ3cu_ITgnHi03qXc-mw84HHYPp9yXnzeXqwPpJ46-_GODY9g6Bcz6sCPnSDOYNawkcl4wZN0CGOIEndfx-Xa2lJXhZ_o45O-Qied0fmSipGjlmzIgVt9kpkBwD_Fm2RJMWlvn53KFnHR5Nue9-jxRAo1QAjuACQKoJZbECmlf4Kvt0yBI2v-VjLT_4KV-Nx2dXLDxUAvya4ebaRBA4CBavnbXTS7tRd5nhNIntQPY"
        />
      </div>
      <div className="relative z-20 w-full max-w-container-max-width px-margin-mobile md:px-margin-desktop text-center md:text-left">
        <h1 className="font-display-lg text-display-lg max-w-2xl mb-4 leading-tight">
          Precision Engineering. <br />
          <span className="text-secondary">Unrivaled Luxury.</span>
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mb-12">
          Experience the future of aviation where every detail is calibrated for your comfort and performance.
        </p>

        {/* Flight Search Widget */}
        <form onSubmit={handleSearch} className="glass-panel p-8 rounded-xl shadow-2xl max-w-5xl">
          <div className="flex flex-col gap-6">
            {/* Trip Toggle & Class */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/30 pb-6">
              <div className="flex bg-surface-container-lowest rounded-lg p-1">
                <button
                  type="button"
                  className={`px-6 py-2 rounded-md font-label-sm text-label-sm transition-all ${tripType === "round"
                      ? "bg-secondary text-on-secondary active-glow"
                      : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  onClick={() => setTripType("round")}
                >
                  Round-trip
                </button>
                <button
                  type="button"
                  className={`px-6 py-2 rounded-md font-label-sm text-label-sm transition-all ${tripType === "one"
                      ? "bg-secondary text-on-secondary active-glow"
                      : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  onClick={() => setTripType("one")}
                >
                  One-way
                </button>
              </div>
              <div className="flex gap-4">
                <div className="relative">
                  <select
                    value={passengers}
                    onChange={(e) => setPassengers(e.target.value)}
                    className="appearance-none bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-2 pr-10 font-label-sm text-label-sm text-on-surface focus:ring-2 focus:ring-secondary/50 focus:border-secondary outline-none transition-all"
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'Passenger' : 'Passengers'}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-2 text-on-surface-variant pointer-events-none">
                    expand_more
                  </span>
                </div>
                <div className="relative">
                  <select
                    value={cabin}
                    onChange={(e) => setCabin(e.target.value)}
                    className="appearance-none bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-2 pr-10 font-label-sm text-label-sm text-on-surface focus:ring-2 focus:ring-secondary/50 focus:border-secondary outline-none transition-all"
                  >
                    <option value="economy">Economy</option>
                    <option value="business">Business</option>
                    <option value="first">First</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-2 text-on-surface-variant pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            {/* Main Search Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-surface-container px-2 font-label-sm text-[10px] uppercase tracking-widest text-secondary z-10">
                  Origin
                </label>
                <div className="flex items-center bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 h-14">
                  <span className="material-symbols-outlined text-on-surface-variant mr-3">flight_takeoff</span>
                  <input
                    required
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="bg-transparent border-none w-full focus:ring-0 text-on-surface font-body-md placeholder:text-outline outline-none"
                    placeholder="LHR"
                    type="text"
                  />
                </div>
              </div>
              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-surface-container px-2 font-label-sm text-[10px] uppercase tracking-widest text-secondary z-10">
                  Destination
                </label>
                <div className="flex items-center bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 h-14">
                  <span className="material-symbols-outlined text-on-surface-variant mr-3">flight_land</span>
                  <input
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="bg-transparent border-none w-full focus:ring-0 text-on-surface font-body-md placeholder:text-outline outline-none"
                    placeholder="JFK"
                    type="text"
                  />
                </div>
              </div>
              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-surface-container px-2 font-label-sm text-[10px] uppercase tracking-widest text-secondary z-10">
                  Departure
                </label>
                <div className="flex items-center bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 h-14 relative">
                  <span className="material-symbols-outlined text-on-surface-variant mr-3">calendar_today</span>
                  <input
                    id="departure-date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-transparent border-none w-full focus:ring-0 text-on-surface font-body-md outline-none cursor-pointer relative z-20 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:z-30"
                    type="date"
                  />
                </div>
              </div>
              <div
                className={`relative transition-opacity ${tripType === "one" ? "opacity-30 pointer-events-none" : "opacity-100"}`}
              >
                <label className="absolute -top-2.5 left-3 bg-surface-container px-2 font-label-sm text-[10px] uppercase tracking-widest text-secondary z-10">
                  Return
                </label>
                <div className="flex items-center bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 h-14 relative">
                  <span className="material-symbols-outlined text-on-surface-variant mr-3">calendar_today</span>
                  <input
                    id="return-date"
                    className="bg-transparent border-none w-full focus:ring-0 text-on-surface font-body-md outline-none cursor-pointer relative z-20 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:z-30"
                    type="date"
                  />
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex justify-end mt-2">
              <button type="submit" className="bg-secondary text-on-secondary px-12 py-4 rounded-lg font-label-sm text-label-sm flex items-center gap-3 hover:bg-secondary-fixed active:scale-95 transition-all shadow-lg active-glow">
                <span className="material-symbols-outlined">search</span>
                Search Flights
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
