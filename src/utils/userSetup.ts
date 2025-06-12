import { User } from '@supabase/supabase-js'
import { SupabaseClient } from '@supabase/supabase-js'
import { createUserProfile, updateLastAccessedInternal } from '@/lib/actions/userActions'
import { upsertUserConfig } from '@/lib/actions/userConfigActions'

export async function handleProfileSetup(supabase: SupabaseClient, authUser: User): Promise<void> {
  try {
    const { data: existingProfile, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', authUser.id)
      .single()

    if (!existingProfile && error?.code === 'PGRST116') {
      const email = authUser.is_anonymous ? null : (authUser.email || null)
      const result = await createUserProfile(authUser.id, email)
      
      if (result.success) {
        const configResult = await upsertUserConfig(authUser.id, {
          articleSource: 'reddit',
          autoScroll: false
        })
        
        if (!configResult.success) {
          console.error('Failed to create default user config:', configResult.error)
        }
      } else {
        console.error('Failed to create profile:', result.error)
        throw new Error(`Failed to create profile: ${result.error}`)
      }
    } else if (existingProfile) {
      const updateResult = await updateLastAccessedInternal(authUser.id)
      if (!updateResult.success) {
        console.error('Failed to update last accessed:', updateResult.error)
      }
    } else if (error) {
      console.error('Error checking for existing profile:', error)
      throw new Error(`Error checking for existing profile: ${error.message}`)
    }
  } catch (error) {
    console.error('Error setting up user:', error)
    throw error
  }
} 