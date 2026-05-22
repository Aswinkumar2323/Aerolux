import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const errorMsg = params.error as string | undefined

  const login = async (formData: FormData) => {
    'use server'
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath('/', 'layout')
    redirect('/')
  }

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto min-h-screen">
      <form className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-on-surface">
        <h1 className="font-headline-lg text-headline-lg font-bold mb-4">Welcome Back</h1>
        {errorMsg && (
          <div className="bg-error-container text-on-error-container p-3 rounded-md mb-4 text-sm font-bold">
            {errorMsg}
          </div>
        )}
        <label className="text-md" htmlFor="email">
          Email
        </label>
        <input
          className="rounded-md px-4 py-2 bg-surface-container-low border border-outline-variant/30 focus:border-secondary outline-none mb-6"
          name="email"
          placeholder="you@example.com"
          required
        />
        <label className="text-md" htmlFor="password">
          Password
        </label>
        <input
          className="rounded-md px-4 py-2 bg-surface-container-low border border-outline-variant/30 focus:border-secondary outline-none mb-6"
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />
        <button
          formAction={login}
          className="bg-secondary text-on-secondary rounded-md px-4 py-2 mb-4 active-glow transition-all font-bold hover:brightness-110 active:scale-98 cursor-pointer"
        >
          Sign In
        </button>
        <p className="text-sm text-center text-on-surface-variant">
          Don't have an account?{' '}
          <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 hover:underline font-bold">
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  )
}

