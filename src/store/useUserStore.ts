import { create } from 'zustand'

interface UserState {
  resetUserStore: () => void
}

export const useUserStore = create<UserState>()(
  () => ({
    resetUserStore: () => {
      // No-op for now; reserved for future non-sensitive cached state
    }
  })
)
