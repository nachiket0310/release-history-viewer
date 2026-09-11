/**
 * Resolve the Facets AntD theme for a web component.
 *
 * Ported from the build-web-component skill's template (a faithful port of
 * control-plane-ui-react's useThemeLoader.ts + theme.utils.ts). `/public/v1/themeFile`
 * serves only the TENANT OVERRIDE — the Facets base theme (radii, control height,
 * font, surfaces, per-component tokens like Table.headerBg) lives only in this
 * vendored JSON, so skipping the fetch or skipping the vendored base both produce
 * stock Ant Design in some tenant, not the Facets look.
 */

import { theme as antdTheme, type ThemeConfig } from 'antd';
import FACETS_BASE from './facets-base.json';
import FACETS_DARK_OVERRIDES from './facets-dark-overrides.json';
import FACETS_DEFAULT_OVERRIDE from './facets-default-override.json';

export type FacetsThemeMode = 'light' | 'dark';

type TokenMap = Record<string, unknown>;
type ComponentsMap = Record<string, TokenMap>;
interface RawTheme {
  token?: TokenMap;
  components?: ComponentsMap;
  algorithm?: unknown;
}

const isHex = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(v);

/** Token shallow-merge + per-component shallow-merge. Override wins. */
function deepMergeTheme(defaultTheme: RawTheme, apiTheme: RawTheme): RawTheme {
  const result: RawTheme = { ...defaultTheme };

  if (apiTheme.token || defaultTheme.token) {
    result.token = { ...defaultTheme.token, ...apiTheme.token };
  }

  if (apiTheme.components || defaultTheme.components) {
    result.components = { ...defaultTheme.components };
    if (apiTheme.components) {
      for (const key of Object.keys(apiTheme.components)) {
        result.components[key] = {
          ...(defaultTheme.components?.[key] || {}),
          ...(apiTheme.components?.[key] || {})
        };
      }
    }
  }

  if (apiTheme.algorithm) result.algorithm = apiTheme.algorithm;

  return result;
}

/**
 * Fetch the tenant override. PUBLIC endpoint — no auth, no CP session needed.
 * Returns null on anything unexpected so the caller falls back to the default
 * override rather than to stock AntD.
 */
export async function fetchTenantTheme(origin: string = window.location.origin): Promise<RawTheme | null> {
  try {
    const res = await fetch(`${origin}/public/v1/themeFile`);
    if (!res.ok) return null;
    const body = await res.json();
    if (!body?.content) return null;
    const parsed = JSON.parse(body.content);
    return parsed && Object.keys(parsed).length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function resolveFacetsTheme({
  dark = false,
  tenantTheme = null
}: { dark?: boolean; tenantTheme?: RawTheme | null } = {}): ThemeConfig {
  // 1 + 2 — base ⊕ override. An absent tenant theme falls back to the same
  // in-code default the React app uses, NOT to an empty object.
  const override: RawTheme =
    tenantTheme && Object.keys(tenantTheme).length > 0 ? tenantTheme : (FACETS_DEFAULT_OVERRIDE as RawTheme);

  const base = deepMergeTheme(FACETS_BASE as RawTheme, override);

  // 3 — the override sets Input/Select borderRadius: 4, which beats the global
  // token. Put the base radii back at component level so they win.
  const radii = {
    borderRadius: (FACETS_BASE as RawTheme).token?.borderRadius,
    borderRadiusSM: (FACETS_BASE as RawTheme).token?.borderRadiusSM,
    borderRadiusLG: (FACETS_BASE as RawTheme).token?.borderRadiusLG
  };
  base.components = {
    ...base.components,
    Button: { ...base.components?.Button, ...radii },
    Input: { ...base.components?.Input, ...radii },
    Select: { ...base.components?.Select, ...radii }
  };

  if (!dark) return base as ThemeConfig;

  // 4 — dark is NOT a second hand-authored palette. Strip every colour from the
  // light theme so antd's darkAlgorithm can generate surfaces, keep the brand
  // accent and all non-colour tokens, then layer the dark overrides on top.
  const isColorTokenKey = (k: string, v: unknown) =>
    k.startsWith('color') || k.startsWith('Color') || /Bg$|Background|Border/.test(k) || isHex(v);

  const cleanToken: TokenMap = {};
  for (const [k, v] of Object.entries(base.token || {})) {
    if (!isColorTokenKey(k, v)) cleanToken[k] = v;
  }
  if (base.token?.colorPrimary) cleanToken.colorPrimary = base.token.colorPrimary;

  const isComponentColorKey = (k: string, v: unknown) => /color|Color|Bg$|Background/.test(k) || isHex(v);

  const cleanComponents: ComponentsMap = {};
  for (const [comp, overrides] of Object.entries(base.components || {})) {
    const cleaned: TokenMap = {};
    for (const [k, v] of Object.entries(overrides || {})) {
      if (!isComponentColorKey(k, v)) cleaned[k] = v;
    }
    if (Object.keys(cleaned).length > 0) cleanComponents[comp] = cleaned;
  }

  const darkComponents: ComponentsMap = { ...cleanComponents };
  for (const [comp, overrides] of Object.entries((FACETS_DARK_OVERRIDES as RawTheme).components || {})) {
    darkComponents[comp] = { ...(cleanComponents[comp] || {}), ...overrides };
  }

  return {
    ...base,
    token: { ...cleanToken, ...(FACETS_DARK_OVERRIDES as RawTheme).token },
    components: darkComponents,
    algorithm: antdTheme.darkAlgorithm
  } as ThemeConfig;
}
