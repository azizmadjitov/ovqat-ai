// NOTE: We've removed the direct JSON imports as they were causing resolution errors.
// We will now fetch these files instead.

const warnedOnce = new Set<string>();

const logWarning = (key: string) => {
  if (!warnedOnce.has(key)) {
    console.warn(`[Tokens] Missing token key: ${key}`);
    warnedOnce.add(key);
  }
};

const pxToRem = (value: string): string => {
    if (typeof value !== 'string' || !value.endsWith('px')) return value;
    const px = parseFloat(value);
    if (isNaN(px)) return value;
    return `${(px / 16).toFixed(3)}rem`;
};

const processColorTokens = (obj: any, prefix = ''): Record<string, string> =>
  Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + '-' : '';
    const propKey = pre + k;
    const value = obj[k];

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        if (value['type'] === 'color' && value['values']?.['Light']) {
            acc[propKey] = value['values']['Light'];
        } else {
            Object.assign(acc, processColorTokens(value, propKey));
        }
    } else {
      acc[propKey] = pxToRem(String(value));
    }
    return acc;
  }, {} as Record<string, string>);

const FONT_FAMILY_MAP: Record<string, string> = {
    "YS Text Cond": "'YS Text Cond'",
    "Google Sans": "'Google Sans'",
};

const processTypographyTokens = (typography: any): string => {
    let cssClasses = '';
    for (const category in typography) {
        for (const size in typography[category]) {
            const style = typography[category][size];
            if (style.$type === 'typography' && style.$value) {
                const className = `.text-${category}-${size.toLowerCase()}`;
                const value = style.$value;
                const rules = [
                    `  font-family: ${FONT_FAMILY_MAP[value.fontFamily] || value.fontFamily};`,
                    `  font-size: ${pxToRem(value.fontSize)};`,
                    `  font-weight: ${value.fontWeight};`,
                    `  line-height: ${pxToRem(value.lineHeight)};`,
                    `  letter-spacing: ${value.letterSpacing || 'normal'};`,
                    `  text-transform: ${value.textTransform || 'none'};`,
                    `  text-decoration: ${value.textDecoration || 'none'};`,
                ].filter(Boolean).join('\n');
                cssClasses += `${className} {\n${rules}\n}\n`;
            }
        }
    }
    return cssClasses;
};

let tokensLoaded = false;
export const loadTokens = async (): Promise<void> => {
  if (tokensLoaded) {
    return;
  }
  try {
    const [colorsResponse, typographyResponse] = await Promise.all([
        fetch('/design/colors.json'),
        fetch('/design/typography.json'),
    ]);
    
    if (!colorsResponse.ok || !typographyResponse.ok) {
        console.error('Failed to fetch one or more design token files.');
        return;
    }

    const colors = await colorsResponse.json();
    const typography = await typographyResponse.json();

    const colorTokens = processColorTokens(colors.collections[0].variables);
    
    const colorVariables = Object.entries(colorTokens)
      .map(([key, value]) => `--${key}: ${value};`)
      .join('\n');

    const typographyClasses = processTypographyTokens(typography);
      
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `:root {\n${colorVariables}\n}\n${typographyClasses}`;
    document.head.appendChild(styleElement);
    tokensLoaded = true;

  } catch (err) {
    console.error('Error loading design tokens:', err);
  }
};

export const getToken = (key: string): string => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(`--${key}`).trim();
  if (!value) {
    logWarning(key);
  }
  return value;
};