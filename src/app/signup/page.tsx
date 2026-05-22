import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const errorMsg = params.error as string | undefined

  const signup = async (formData: FormData) => {
    'use server'
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const contactNo = formData.get('contactNo') as string
    const country = formData.get('country') as string

    const supabase = await createClient()
    const { headers } = await import('next/headers')
    const headersList = await headers()
    const origin = headersList.get('origin') || 'http://localhost:3000'

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/confirm?next=/`,
        data: {
          first_name: firstName,
          last_name: lastName,
          contact_no: contactNo,
          country: country,
        },
      },
    })

    if (error) {
      redirect(`/signup?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath('/', 'layout')
    redirect('/')
  }

  // List of countries for the country select list
  const countries = [
    'Australia',
    'Brazil',
    'Canada',
    'France',
    'Germany',
    'India',
    'Italy',
    'Japan',
    'Singapore',
    'South Africa',
    'Spain',
    'United Arab Emirates',
    'United Kingdom',
    'United States',
  ]

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-lg justify-center gap-2 mx-auto min-h-screen py-12">
      <form className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-on-surface">
        <h1 className="font-headline-lg text-headline-lg font-bold mb-2">Create Account</h1>
        <p className="text-sm text-on-surface-variant mb-6">
          Sign up to access elite flight benefits and manage bookings.
        </p>

        {errorMsg && (
          <div className="bg-error-container text-on-error-container p-3 rounded-md mb-4 text-sm font-bold">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1 text-on-surface-variant" htmlFor="firstName">
              First Name
            </label>
            <input
              className="rounded-md px-4 py-2 bg-surface-container-low border border-outline-variant/30 focus:border-secondary outline-none text-on-surface"
              name="firstName"
              placeholder="John"
              required
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1 text-on-surface-variant" htmlFor="lastName">
              Last Name
            </label>
            <input
              className="rounded-md px-4 py-2 bg-surface-container-low border border-outline-variant/30 focus:border-secondary outline-none text-on-surface"
              name="lastName"
              placeholder="Doe"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1 text-on-surface-variant" htmlFor="contactNo">
              Contact No
            </label>
            <input
              className="rounded-md px-4 py-2 bg-surface-container-low border border-outline-variant/30 focus:border-secondary outline-none text-on-surface"
              name="contactNo"
              type="tel"
              placeholder="+1 555-0199"
              required
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1 text-on-surface-variant" htmlFor="country">
              Country
            </label>
            <select
              className="rounded-md px-4 py-2 bg-surface-container-low border border-outline-variant/30 focus:border-secondary outline-none text-on-surface h-[42px]"
              name="country"
              defaultValue=""
              required
            >
              <option value="" disabled>
                Select Country
              </option>
              {countries.map((c) => (
                <option key={c} value={c} className="bg-surface-container text-on-surface">
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col mb-4">
          <label className="text-sm font-medium mb-1 text-on-surface-variant" htmlFor="email">
            Email Address
          </label>
          <input
            className="rounded-md px-4 py-2 bg-surface-container-low border border-outline-variant/30 focus:border-secondary outline-none text-on-surface"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="flex flex-col mb-6">
          <label className="text-sm font-medium mb-1 text-on-surface-variant" htmlFor="password">
            Password
          </label>
          <input
            className="rounded-md px-4 py-2 bg-surface-container-low border border-outline-variant/30 focus:border-secondary outline-none text-on-surface"
            type="password"
            name="password"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          formAction={signup}
          className="bg-indigo-600 text-white rounded-md px-4 py-2.5 mb-4 shadow-lg shadow-indigo-600/20 transition-all font-bold hover:bg-indigo-500 active:scale-98 cursor-pointer"
        >
          Sign Up
        </button>

        <p className="text-sm text-center text-on-surface-variant">
          Already have an account?{' '}
          <Link href="/login" className="text-secondary hover:underline font-bold">
            Sign In
          </Link>
        </p>
      </form>
    </div>
  )
}
