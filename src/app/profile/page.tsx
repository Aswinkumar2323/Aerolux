import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/landing/Navbar'
import { signOutAction } from '@/app/actions/profile'
import DeleteAccountButton from '@/components/profile/DeleteAccountButton'
import { Booking, Passenger } from '@/types'

interface SavedTraveler {
  full_name: string
  passport_no: string
  nationality: string
  dob: string
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all bookings for this user to load stats & passenger data
  const { data: bookingsData, error } = await supabase
    .from('bookings')
    .select(`
      id,
      booked_at,
      total_price,
      pnr_code,
      status,
      flight:flights (
        flight_no,
        origin,
        destination,
        departs_at,
        arrives_at
      ),
      seat:seats (
        seat_number,
        class
      ),
      passengers (
        full_name,
        passport_no,
        nationality,
        dob
      )
    `)
    .eq('user_id', user.id)
    .order('booked_at', { ascending: false })

  const bookings = bookingsData as Booking[] | null

  if (error) {
    console.error('Error fetching profile bookings:', error)
  }

  // Calculate statistics
  const totalBookings = bookings?.length || 0
  const activeBookings = bookings?.filter(b => b.status !== 'cancelled' && new Date(b.flight.departs_at) > new Date()) || []
  const upcomingCount = activeBookings.length
  const completedCount = bookings?.filter(b => b.status !== 'cancelled' && new Date(b.flight.departs_at) <= new Date()).length || 0
  const cancelledCount = bookings?.filter(b => b.status === 'cancelled').length || 0
  const totalSpent = bookings?.reduce((sum, b) => b.status !== 'cancelled' ? sum + Number(b.total_price) : sum, 0) || 0

  // Determine membership tier dynamically based on bookings
  let membershipTier = 'Silver Explorer'
  let tierColor = 'from-slate-400 to-slate-200 text-slate-800'
  let badgeBorder = 'border-slate-400/30'
  if (totalBookings >= 5) {
    membershipTier = 'Elite Platinum'
    tierColor = 'from-cyan-400 to-indigo-200 text-cyan-950'
    badgeBorder = 'border-cyan-400/30'
  } else if (totalBookings >= 2) {
    membershipTier = 'Elite Gold'
    tierColor = 'from-amber-400 to-yellow-200 text-amber-950'
    badgeBorder = 'border-amber-400/30'
  }

  // Extract unique traveler profiles from passenger records
  const travelersMap = new Map<string, SavedTraveler>()
  bookings?.forEach(b => {
    b.passengers?.forEach((p: Passenger) => {
      const key = p.passport_no?.trim() || p.full_name?.trim()
      if (key && !travelersMap.has(key)) {
        travelersMap.set(key, {
          full_name: p.full_name,
          passport_no: p.passport_no,
          nationality: p.nationality,
          dob: p.dob
        })
      }
    })
  })

  const savedTravelers = Array.from(travelersMap.values())
  const primaryTraveler = savedTravelers[0] || null

  // Format date joined
  const dateJoined = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A'

  // Get next upcoming flight
  const nextFlight = activeBookings.length > 0 ? activeBookings[activeBookings.length - 1] : null

  return (
    <div className="min-h-screen bg-background text-on-background pb-12">
      <Navbar />

      <main className="w-full px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto pt-32">
        {/* Profile Hero Header */}
        <div className="glass-panel p-6 md:p-8 rounded-3xl border border-outline-variant/10 relative overflow-hidden mb-8">
          <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-br from-secondary/10 to-transparent rounded-full filter blur-3xl pointer-events-none -z-10" />
          
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center justify-between">
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              {/* Profile Avatar with glow effect */}
              <div className="relative">
                <div className="absolute inset-0 bg-secondary/30 rounded-full blur-md active-glow" />
                <img 
                  alt="User profile avatar" 
                  className="relative w-24 h-24 rounded-full bg-surface-variant ring-4 ring-secondary/30 object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMNMjeLGnmJAX_Q6WhUfJzD71sxanSditnNbCgGuuWwwn3OCc4Qo1vs5_ai3HjTIX8ew3ihhiPMayfvaTUj2RHb3ThNlrrRnWLT0s1zYjOsdNWu4dkooiX_ZPFp_AI3TgA6W0fjKbAUW57-99nu6ZPDuAhhqCAa78spUkQoInUI_EaUvXGtcugMrxUKaGHJbtHHpqz2DB38Cbd0klEsT7IyzE_8hZagVA-wSw221QQvy_k2Bv9aDibiFwIah53b7At__S7L8wDgEA"
                />
              </div>

              <div>
                <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                  <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">
                    {user.user_metadata?.first_name 
                      ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
                      : primaryTraveler 
                        ? primaryTraveler.full_name 
                        : user.email?.split('@')[0]}
                  </h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${tierColor} shadow-md uppercase tracking-wider`}>
                    {membershipTier}
                  </span>
                </div>
                <p className="text-on-surface-variant font-mono text-sm mb-1">{user.email}</p>
                <div className="flex items-center gap-2 justify-center md:justify-start text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  <span>Member since {dateJoined}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 md:gap-4">
              <Link 
                href="/bookings"
                className="border border-outline-variant/30 text-on-surface px-5 py-2.5 rounded-xl font-bold hover:bg-surface-variant/40 active:scale-95 transition-all text-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">airplane_ticket</span>
                Manage Bookings
              </Link>

              <form action={signOutAction}>
                <button 
                  type="submit"
                  className="bg-error-container text-on-error-container border border-error/20 px-5 py-2.5 rounded-xl font-bold hover:bg-error-container/80 active:scale-95 transition-all text-sm flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  Sign Out
                </button>
              </form>

              <DeleteAccountButton />
            </div>
          </div>
        </div>

        {/* Travel Stats Quick Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass-panel p-6 rounded-2xl border border-outline-variant/10 flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20">
              <span className="material-symbols-outlined text-2xl">flight_takeoff</span>
            </div>
            <div>
              <span className="text-xs text-on-surface-variant uppercase tracking-wider block font-bold">Total Trips</span>
              <span className="text-2xl font-bold text-on-surface">{totalBookings}</span>
              <span className="text-[10px] text-on-surface-variant block mt-0.5">{upcomingCount} upcoming • {completedCount} past</span>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-outline-variant/10 flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <span className="material-symbols-outlined text-2xl">payments</span>
            </div>
            <div>
              <span className="text-xs text-on-surface-variant uppercase tracking-wider block font-bold">Total Spent</span>
              <span className="text-2xl font-bold text-on-surface">£{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-[10px] text-on-surface-variant block mt-0.5">Excludes cancelled flights</span>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-outline-variant/10 flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
              <span className="material-symbols-outlined text-2xl">schedule</span>
            </div>
            <div>
              <span className="text-xs text-on-surface-variant uppercase tracking-wider block font-bold">Upcoming</span>
              <span className="text-2xl font-bold text-on-surface">{upcomingCount}</span>
              <span className="text-[10px] text-on-surface-variant block mt-0.5">Flights yet to depart</span>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-outline-variant/10 flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20">
              <span className="material-symbols-outlined text-2xl">cancel</span>
            </div>
            <div>
              <span className="text-xs text-on-surface-variant uppercase tracking-wider block font-bold">Cancelled</span>
              <span className="text-2xl font-bold text-on-surface">{cancelledCount}</span>
              <span className="text-[10px] text-on-surface-variant block mt-0.5">Cancelled flight bookings</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Account Details & Status */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-outline-variant/10">
              <h3 className="text-lg font-bold mb-4 text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">manage_accounts</span>
                Account Information
              </h3>
              
              <div className="flex flex-col gap-4 text-sm">
                <div className="pb-3 border-b border-outline-variant/10">
                  <span className="text-xs text-on-surface-variant block font-semibold mb-1">Email Address</span>
                  <span className="text-on-surface font-semibold">{user.email}</span>
                </div>

                {user.user_metadata?.first_name && (
                  <div className="pb-3 border-b border-outline-variant/10">
                    <span className="text-xs text-on-surface-variant block font-semibold mb-1">Name</span>
                    <span className="text-on-surface font-semibold">
                      {user.user_metadata.first_name} {user.user_metadata.last_name || ''}
                    </span>
                  </div>
                )}

                {user.user_metadata?.contact_no && (
                  <div className="pb-3 border-b border-outline-variant/10">
                    <span className="text-xs text-on-surface-variant block font-semibold mb-1">Contact Number</span>
                    <span className="text-on-surface font-semibold">{user.user_metadata.contact_no}</span>
                  </div>
                )}

                {user.user_metadata?.country && (
                  <div>
                    <span className="text-xs text-on-surface-variant block font-semibold mb-1">Country</span>
                    <span className="text-on-surface font-semibold">{user.user_metadata.country}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Next Flight Showcase */}
            {nextFlight && (
              <div className="glass-panel p-6 rounded-2xl border border-outline-variant/10 relative overflow-hidden">
                <div className="absolute right-3 top-3 text-7xl font-bold opacity-[0.02] pointer-events-none select-none font-mono">
                  {nextFlight.flight.flight_no}
                </div>
                <h3 className="text-lg font-bold mb-4 text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">near_me</span>
                  Next Departure
                </h3>
                
                <div className="bg-surface-container/40 p-4 rounded-xl border border-outline-variant/10 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-mono font-bold bg-secondary/15 text-secondary px-2.5 py-0.5 rounded border border-secondary/20">
                      {nextFlight.flight.flight_no}
                    </span>
                    <span className="text-xs text-on-surface-variant font-mono">PNR: {nextFlight.pnr_code}</span>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <div className="text-center text-left">
                      <span className="text-2xl font-bold text-on-surface">{nextFlight.flight.origin}</span>
                      <span className="text-[10px] text-on-surface-variant block uppercase tracking-wider">Origin</span>
                    </div>
                    <span className="material-symbols-outlined text-secondary">flight</span>
                    <div className="text-center text-right">
                      <span className="text-2xl font-bold text-on-surface">{nextFlight.flight.destination}</span>
                      <span className="text-[10px] text-on-surface-variant block uppercase tracking-wider">Destination</span>
                    </div>
                  </div>

                  <div className="text-xs text-on-surface-variant space-y-1">
                    <div className="flex justify-between">
                      <span>Departs:</span>
                      <span className="font-semibold text-on-surface">
                        {new Date(nextFlight.flight.departs_at).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Seat:</span>
                      <span className="font-semibold text-secondary uppercase">
                        {nextFlight.seat.seat_number} ({nextFlight.seat.class})
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/bookings"
                  className="bg-secondary text-on-secondary w-full py-2.5 rounded-xl font-bold hover:bg-secondary-fixed active:scale-95 transition-all text-sm block text-center shadow-md shadow-secondary/10"
                >
                  View Flight Details
                </Link>
              </div>
            )}
          </div>

          {/* Right Column: Traveler Profiles */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-outline-variant/10">
              <h3 className="text-lg font-bold mb-2 text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">badge</span>
                Traveler Profile
              </h3>
              <p className="text-xs text-on-surface-variant mb-6">
                Saved passport and personal information retrieved from your airline reservation history.
              </p>

              {savedTravelers.length > 0 ? (
                <div className="flex flex-col gap-6">
                  {savedTravelers.map((traveler, index) => (
                    <div 
                      key={traveler.passport_no || traveler.full_name}
                      className="bg-surface-container/40 p-5 rounded-xl border border-outline-variant/10 relative overflow-hidden"
                    >
                      {index === 0 && (
                        <span className="absolute top-3 right-3 text-[10px] font-bold bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Primary Traveler
                        </span>
                      )}

                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                          <span className="material-symbols-outlined">person</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-on-surface text-base">{traveler.full_name}</h4>
                          <span className="text-xs text-on-surface-variant block uppercase tracking-wider">{traveler.nationality} National</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-outline-variant/15 pt-4 text-xs font-mono">
                        <div>
                          <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block font-bold font-sans mb-1">Passport No</span>
                          <span className="text-on-surface font-semibold text-sm">{traveler.passport_no || '••••••••'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block font-bold font-sans mb-1">Date of Birth</span>
                          <span className="text-on-surface font-semibold text-sm">
                            {new Date(traveler.dob).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block font-bold font-sans mb-1">Nationality</span>
                          <span className="text-on-surface font-semibold text-sm">{traveler.nationality}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-outline-variant/30 rounded-xl p-8 text-center bg-surface-container/20">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-3 block">contact_mail</span>
                  <h4 className="font-semibold text-sm mb-1">No Traveler Info Found</h4>
                  <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                    You haven't saved any traveler information yet. Once you book a flight, your traveler and passport profile will show up here automatically!
                  </p>
                  <Link 
                    href="/"
                    className="text-secondary hover:text-secondary-fixed text-xs font-bold inline-block mt-4 hover:underline"
                  >
                    Book Your First Flight Now &rarr;
                  </Link>
                </div>
              )}
            </div>

            {/* Travel Guidelines Advisory Banner */}
            <div className="glass-panel p-6 rounded-2xl border border-outline-variant/10 bg-gradient-to-r from-secondary/5 to-transparent relative overflow-hidden">
              <div className="flex gap-4 items-start">
                <span className="material-symbols-outlined text-secondary text-2xl mt-0.5">info</span>
                <div>
                  <h4 className="font-bold text-sm text-on-surface mb-1">Traveler Security & Verification</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    AeroLux matches your passenger records directly with national border authorities. Make sure your passport number and nationality match your travel document details. If you need to make changes to your booking details, please do so via the <Link href="/bookings" className="text-secondary hover:underline">My Bookings</Link> dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
