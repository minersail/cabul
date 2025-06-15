import { useMemo } from 'react';
import { OptionConfig } from '@/components/OptionsPane';
import { ArticleSource } from '@/reducers/articleLoaderReducer';
import { ClientUserConfig } from './useUserConfig';

interface UseOptionsConfigProps {
  userConfig: ClientUserConfig | null;
  updateConfig: (field: keyof ClientUserConfig, value: any) => Promise<void>;
}

export function useOptionsConfig({ userConfig, updateConfig }: UseOptionsConfigProps): OptionConfig[] {
  const optionsConfig = useMemo(() => {
    if (!userConfig) {
      // Return empty array or disabled options while config is loading
      return [];
    }
    
    return [
      {
        id: 'articleSource',
        label: 'Article Source',
        type: 'select' as const,
        value: userConfig.articleSource,
        onChange: (value: ArticleSource) => updateConfig('articleSource', value),
        options: [
          { value: 'reddit' as const, label: 'Reddit Posts' },
          { value: 'lemonde' as const, label: 'Le Monde Articles' },
          { value: 'scriptslug' as const, label: 'Movie Scripts' }
        ]
      },
      {
        id: 'autoScroll',
        label: 'Auto Scroll',
        type: 'boolean' as const,
        value: userConfig.autoScroll,
        onChange: (value: boolean) => updateConfig('autoScroll', value)
      }
    ];
  }, [userConfig, updateConfig]);

  return optionsConfig;
} 