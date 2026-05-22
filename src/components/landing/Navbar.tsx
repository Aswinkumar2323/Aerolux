import { createClient } from "@/lib/supabase/server";
import NavbarClient from "./NavbarClient";

const DEFAULT_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuAMNMjeLGnmJAX_Q6WhUfJzD71sxanSditnNbCgGuuWwwn3OCc4Qo1vs5_ai3HjTIX8ew3ihhiPMayfvaTUj2RHb3ThNlrrRnWLT0s1zYjOsdNWu4dkooiX_ZPFp_AI3TgA6W0fjKbAUW57-99nu6ZPDuAhhqCAa78spUkQoInUI_EaUvXGtcugMrxUKaGHJbtHHpqz2DB38Cbd0klEsT7IyzE_8hZagVA-wSw221QQvy_k2Bv9aDibiFwIah53b7At__S7L8wDgEA";

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let navUser: {
    email?: string;
    displayName: string;
    avatarUrl: string;
  } | null = null;

  if (user) {
    let displayName = "Profile";
    const metaFirstName = user.user_metadata?.first_name;
    const metaLastName = user.user_metadata?.last_name;

    if (metaFirstName) {
      displayName = `${metaFirstName} ${metaLastName || ""}`.trim();
    } else {
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("passengers(full_name)")
        .eq("user_id", user.id)
        .order("booked_at", { ascending: false })
        .limit(1);

      interface NavbarBooking {
        passengers: { full_name: string }[] | null;
      }
      const bookings = bookingsData as unknown as NavbarBooking[] | null;
      const primaryName = bookings?.[0]?.passengers?.[0]?.full_name;
      if (primaryName) {
        displayName = primaryName;
      } else if (user.email) {
        displayName = user.email.split("@")[0];
      }
    }

    navUser = {
      email: user.email,
      displayName,
      avatarUrl: DEFAULT_AVATAR,
    };
  }

  return <NavbarClient user={navUser} />;
}
