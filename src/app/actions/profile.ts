'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function deleteAccountAction() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase.rpc('delete_user_account')
  if (error) {
    console.error('Failed to delete account:', error)
    return { error: error.message }
  }

  await supabase.auth.signOut()
  
  revalidatePath('/', 'layout')
  redirect('/')
}

