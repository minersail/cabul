import { useEffect, useState, useCallback } from 'react'
import { getUserConfig, upsertUserConfig } from '@/lib/actions/userConfigActions'
import { useAuth } from './useAuth'
import { ArticleSource } from '@/reducers/articleLoaderReducer'

export interface ClientUserConfig {
  articleSource: ArticleSource;
  autoScroll: boolean;
}

const defaultConfig: ClientUserConfig = {
  articleSource: 'reddit',
  autoScroll: false
}

export function useUserConfig() {
  const { user } = useAuth()
  const [config, setConfig] = useState<ClientUserConfig>(defaultConfig)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Save user config to database
  const saveConfig = useCallback(async (newConfig: Partial<ClientUserConfig>) => {
    if (!user?.id) {
      console.warn('Cannot save config: no user found')
      return
    }

    try {
      setError(null)
      
      const result = await upsertUserConfig(user.id, {
        articleSource: newConfig.articleSource,
        autoScroll: newConfig.autoScroll
      })
      
      if (result.success) {
        setConfig(prev => ({
          ...prev,
          ...newConfig
        }))
      } else {
        setError(result.error)
        console.error('Failed to save user config:', result.error)
      }
    } catch (err) {
      console.error('Error saving user config:', err)
      setError('Failed to save user configuration')
    }
  }, [user?.id])

  // Load user config from database
  const loadConfig = useCallback(async () => {
    if (!user?.id) {
      setConfig(defaultConfig)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const result = await getUserConfig(user.id)
      
      if (result.success) {
        if (result.data) {
          setConfig({
            articleSource: result.data.articleSource as ArticleSource,
            autoScroll: result.data.autoScroll
          })
        } else {
          // No config found, use defaults and create one
          setConfig(defaultConfig)
          // Create default config in background without waiting
          upsertUserConfig(user.id, {
            articleSource: defaultConfig.articleSource,
            autoScroll: defaultConfig.autoScroll
          }).catch(err => {
            console.error('Failed to create default user config:', err)
          })
        }
      } else {
        setError(result.error)
        setConfig(defaultConfig)
      }
    } catch (err) {
      console.error('Error loading user config:', err)
      setError('Failed to load user configuration')
      setConfig(defaultConfig)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Update a single config field
  const updateConfig = useCallback(async (field: keyof ClientUserConfig, value: any) => {
    const newConfig = { [field]: value }
    await saveConfig(newConfig)
  }, [saveConfig])

  // Load config when user changes
  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  return {
    config,
    configLoading: loading,
    error,
    updateConfig,
    saveConfig,
    reload: loadConfig
  }
} 