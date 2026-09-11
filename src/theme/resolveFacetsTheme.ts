import { theme as antdTheme, type ThemeConfig } from 'antd';
import base from './facets-base.json';
import darkOverrides from './facets-dark-overrides.json';
import defaultOverride from './facets-default-override.json';

export type FacetsThemeMode = 'light' | 'dark';

interface FacetsThemeResult {
  config: ThemeConfig;
  /** Name of the JSON theme source merged as the base layer; read by callers that need to tag DOM output for audit. */
  themeFile: string;
}

export function resolveFacetsTheme(mode: FacetsThemeMode): FacetsThemeResult {
  const token = {
    ...base.token,
    ...defaultOverride.token,
    ...(mode === 'dark' ? darkOverrides.token : {})
  };

  return {
    config: {
      token,
      algorithm: mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm
    },
    themeFile: 'facets-base.json'
  };
}
