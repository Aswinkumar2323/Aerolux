'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { deleteAccountAction } from '@/app/actions/profile'

export default function DeleteAccountButton() {
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const handleDelete = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await deleteAccountAction()
      if (res?.error) {
        setError(res.error)
        setLoading(false)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setError(null)
          setModalOpen(true)
        }}
        className="bg-red-600 text-white hover:bg-red-700 hover:brightness-110 active-glow border border-red-500/20 px-5 py-2.5 rounded-xl font-bold active:scale-95 transition-all text-sm flex items-center gap-2 cursor-pointer"
      >
        <span className="material-symbols-outlined text-lg">delete_forever</span>
        Delete Account
      </button>

      {modalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-surface-container border border-outline-variant/20 max-w-md w-full p-8 rounded-2xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-headline-lg text-headline-lg mb-4 text-error font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl">warning</span> Delete Account
            </h3>
            <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
              Are you sure you want to permanently delete your account? 
              <br /><br />
              This action is <span className="text-error font-bold">irreversible</span> and will delete your entire user profile, bookings, passenger histories, and cancellation records from our systems. Any reserved seats will be released immediately.
            </p>

            {error && (
              <div className="bg-error-container text-on-error-container text-xs p-4 rounded-lg mb-6 border border-error/30 font-semibold">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                disabled={loading}
                onClick={() => setModalOpen(false)}
                className="flex-1 py-3 bg-surface-container-high hover:bg-surface-variant rounded-lg font-bold text-sm transition-all cursor-pointer text-on-surface"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={handleDelete}
                className="flex-1 py-3 bg-red-600 text-white hover:bg-red-700 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
