import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";

interface DestinationDetails {
  city: string;
  country: string;
  image: string;
  description: string;
}

const DESTINATION_MAP: Record<string, DestinationDetails> = {
  JFK: {
    city: "New York",
    country: "USA",
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=800&auto=format&fit=crop",
    description: "Daily Flights",
  },
  LHR: {
    city: "London",
    country: "UK",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ca1ad?q=80&w=800&auto=format&fit=crop",
    description: "Hub Destination",
  },
  HND: {
    city: "Tokyo",
    country: "Japan",
    image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=800&auto=format&fit=crop",
    description: "Daily Direct",
  },
  SIN: {
    city: "Singapore",
    country: "Singapore",
    image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=800&auto=format&fit=crop",
    description: "Exclusive Routes",
  },
  DXB: {
    city: "Dubai",
    country: "UAE",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=800&auto=format&fit=crop",
    description: "Luxury Travel",
  },
  CDG: {
    city: "Paris",
    country: "France",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop",
    description: "Romantic Gateway",
  },
  SYD: {
    city: "Sydney",
    country: "Australia",
    image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=800&auto=format&fit=crop",
    description: "Scenic Coastlines",
  },
  LAX: {
    city: "Los Angeles",
    country: "USA",
    image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop",
    description: "West Coast Hub",
  },
};

const getDestinationDetails = (code: string): DestinationDetails => {
  return (
    DESTINATION_MAP[code.toUpperCase()] || {
      city: code,
      country: "Explore",
      image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=800&auto=format&fit=crop",
      description: "Special Route",
    }
  );
};

export default async function Destinations() {
  const supabase = await createClient();

  // Fetch flights to extract popular destinations
  const { data: flights, error } = await supabase
    .from("flights")
    .select("origin, destination, base_price, departs_at")
    .order("base_price", { ascending: true });

  if (error || !flights || flights.length === 0) {
    return null;
  }

  // Deduplicate destinations, keeping the one with the lowest base price
  const uniqueDestinationsMap = new Map<
    string,
    {
      code: string;
      origin: string;
      basePrice: number;
      departsAt: string;
    }
  >();

  for (const flight of flights) {
    const destCode = flight.destination.toUpperCase();
    if (!uniqueDestinationsMap.has(destCode)) {
      uniqueDestinationsMap.set(destCode, {
        code: destCode,
        origin: flight.origin,
        basePrice: Number(flight.base_price),
        departsAt: flight.departs_at,
      });
    }
  }

  const destinations = Array.from(uniqueDestinationsMap.values());
  if (destinations.length === 0) return null;

  // Split into featured (first 3) and remaining
  const featured = destinations.slice(0, 3);
  const remaining = destinations.slice(3);

  const getSearchUrl = (dest: typeof destinations[0]) => {
    const dateFormatted = dest.departsAt ? dest.departsAt.split("T")[0] : "";
    return `/search?origin=${dest.origin}&dest=${dest.code}&date=${dateFormatted}&passengers=1&class=economy`;
  };

  return (
    <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto">
      <div className="flex justify-between items-end mb-12">
        <div>
          <span className="font-label-sm text-label-sm text-secondary uppercase tracking-[0.2em] mb-2 block">
            Curated Journeys
          </span>
          <h2 className="font-headline-lg text-headline-lg">Popular Destinations</h2>
        </div>
      </div>

      {destinations.length >= 3 ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter h-auto md:h-[600px]">
            {/* Large Featured Item */}
            {(() => {
              const dest = featured[0];
              const details = getDestinationDetails(dest.code);
              return (
                <Link
                  href={getSearchUrl(dest)}
                  className="md:col-span-7 relative group overflow-hidden rounded-xl bg-surface-container block cursor-pointer min-h-[300px] md:min-h-0"
                >
                  <Image
                    fill
                    sizes="(max-width: 768px) 100vw, 60vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    alt={`A beautiful shot of ${details.city}`}
                    src={details.image}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface/95 via-surface/30 to-transparent p-8 flex flex-col justify-end">
                    <div className="flex justify-between items-end relative z-10">
                      <div>
                        <h3 className="font-headline-lg text-headline-lg mb-1">
                          {details.city}, {details.country}
                        </h3>
                        <p className="text-on-surface-variant font-body-md">
                          From £{dest.basePrice} • {details.description}
                        </p>
                      </div>
                      <div className="p-4 bg-secondary text-on-secondary rounded-full material-symbols-outlined shadow-lg transition-transform group-hover:translate-x-1">
                        arrow_forward
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })()}

            {/* Vertical Stack */}
            <div className="md:col-span-5 grid grid-rows-2 gap-gutter min-h-[400px] md:min-h-0">
              {featured.slice(1).map((dest) => {
                const details = getDestinationDetails(dest.code);
                return (
                  <Link
                    key={dest.code}
                    href={getSearchUrl(dest)}
                    className="relative group overflow-hidden rounded-xl bg-surface-container block cursor-pointer"
                  >
                    <Image
                      fill
                      sizes="(max-width: 768px) 100vw, 40vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      alt={`A beautiful shot of ${details.city}`}
                      src={details.image}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface/90 via-surface/30 to-transparent p-6 flex flex-col justify-end">
                      <div className="flex justify-between items-end relative z-10">
                        <div>
                          <h3 className="font-body-lg text-body-lg font-bold">
                            {details.city}, {details.country}
                          </h3>
                          <p className="text-on-surface-variant text-sm">
                            From £{dest.basePrice} • {details.description}
                          </p>
                        </div>
                        <div className="p-2 bg-secondary text-on-secondary rounded-full material-symbols-outlined shadow-md transition-transform group-hover:translate-x-1 text-sm">
                          arrow_forward
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Remaining Items Grid */}
          {remaining.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6 mt-6">
              {remaining.map((dest) => {
                const details = getDestinationDetails(dest.code);
                return (
                  <Link
                    key={dest.code}
                    href={getSearchUrl(dest)}
                    className="relative group overflow-hidden rounded-xl bg-surface-container block cursor-pointer aspect-4/3 min-h-[220px]"
                  >
                    <Image
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 20vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      alt={`A beautiful shot of ${details.city}`}
                      src={details.image}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface/95 via-surface/30 to-transparent p-6 flex flex-col justify-end">
                      <div className="flex justify-between items-end relative z-10">
                        <div>
                          <h3 className="font-body-lg text-body-lg font-bold text-on-surface">
                            {details.city}, {details.country}
                          </h3>
                          <p className="text-on-surface-variant text-sm font-semibold text-secondary">
                            From £{dest.basePrice}
                          </p>
                        </div>
                        <div className="p-2 bg-secondary text-on-secondary rounded-full material-symbols-outlined shadow-md transition-transform group-hover:translate-x-1 text-sm">
                          arrow_forward
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* If there are less than 3 destinations, display them in a clean grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((dest) => {
            const details = getDestinationDetails(dest.code);
            return (
              <Link
                key={dest.code}
                href={getSearchUrl(dest)}
                className="relative group overflow-hidden rounded-xl bg-surface-container block cursor-pointer aspect-[16/10] min-h-[250px]"
              >
                <Image
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  alt={`A beautiful shot of ${details.city}`}
                  src={details.image}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface/95 via-surface/30 to-transparent p-6 flex flex-col justify-end">
                  <div className="flex justify-between items-end relative z-10">
                    <div>
                      <h3 className="font-body-lg text-body-lg font-bold text-on-surface">
                        {details.city}, {details.country}
                      </h3>
                      <p className="text-on-surface-variant text-sm font-semibold text-secondary">
                        From £{dest.basePrice} • {details.description}
                      </p>
                    </div>
                    <div className="p-2 bg-secondary text-on-secondary rounded-full material-symbols-outlined shadow-md transition-transform group-hover:translate-x-1 text-sm">
                      arrow_forward
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
