const USER_PROFILE_KEY = 'userProfile'

export interface UserProfile {
  budgetPreference: number | null
  favoriteTypes: string[]
  favoriteTags: string[]
  dislikedTags: string[]
  eatingHabits: string[]
  updatedAt: number
}

export type UserProfileUpdate = Partial<Omit<UserProfile, 'updatedAt'>>

const uniqueStrings = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return Array.from(new Set(value.filter(item => typeof item === 'string')))
}

const normalizeProfile = (value: unknown): UserProfile | null => {
  if (!value || typeof value !== 'object') return null

  const profile = value as Partial<UserProfile>
  const budgetPreference = typeof profile.budgetPreference === 'number'
    ? profile.budgetPreference
    : null

  return {
    budgetPreference,
    favoriteTypes: uniqueStrings(profile.favoriteTypes),
    favoriteTags: uniqueStrings(profile.favoriteTags),
    dislikedTags: uniqueStrings(profile.dislikedTags),
    eatingHabits: uniqueStrings(profile.eatingHabits),
    updatedAt: typeof profile.updatedAt === 'number' ? profile.updatedAt : Date.now(),
  }
}

export const getProfile = (): UserProfile | null => {
  const storedProfile: unknown = wx.getStorageSync(USER_PROFILE_KEY)
  return normalizeProfile(storedProfile)
}

export const saveProfile = (profile: UserProfile): UserProfile => {
  const normalizedProfile = normalizeProfile(profile)
  const savedProfile: UserProfile = normalizedProfile || {
    budgetPreference: null,
    favoriteTypes: [],
    favoriteTags: [],
    dislikedTags: [],
    eatingHabits: [],
    updatedAt: Date.now(),
  }

  savedProfile.updatedAt = Date.now()
  wx.setStorageSync(USER_PROFILE_KEY, savedProfile)
  return savedProfile
}

export const updateProfile = (updates: UserProfileUpdate): UserProfile => {
  const currentProfile = getProfile() || {
    budgetPreference: null,
    favoriteTypes: [],
    favoriteTags: [],
    dislikedTags: [],
    eatingHabits: [],
    updatedAt: Date.now(),
  }

  return saveProfile({
    ...currentProfile,
    ...updates,
    favoriteTypes: updates.favoriteTypes
      ? uniqueStrings(updates.favoriteTypes)
      : currentProfile.favoriteTypes,
    favoriteTags: updates.favoriteTags
      ? uniqueStrings(updates.favoriteTags)
      : currentProfile.favoriteTags,
    dislikedTags: updates.dislikedTags
      ? uniqueStrings(updates.dislikedTags)
      : currentProfile.dislikedTags,
    eatingHabits: updates.eatingHabits
      ? uniqueStrings(updates.eatingHabits)
      : currentProfile.eatingHabits,
    updatedAt: Date.now(),
  })
}

export const clearProfile = () => {
  wx.removeStorageSync(USER_PROFILE_KEY)
}
