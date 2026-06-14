/**
 * Contrast Ratio Calculation Utilities
 * 
 * Implements WCAG 2.1 contrast ratio calculations and color conversion helpers
 * for ensuring accessibility compliance in light and dark modes.
 * 
 * References:
 * - WCAG 2.1: https://www.w3.org/TR/WCAG21/#contrast-minimum
 * - Relative Luminance: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */

/**
 * RGB color representation
 */
export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

/**
 * HSL color representation
 */
export interface HSL {
  h: number; // 0-360 (degrees)
  s: number; // 0-100 (percentage)
  l: number; // 0-100 (percentage)
}

/**
 * Contrast validation result
 */
export interface ContrastValidation {
  ratio: number;
  meetsAA: boolean;
  meetsAAA: boolean;
  level: 'AAA' | 'AA' | 'Fail';
}

/**
 * Convert a hex color string to RGB
 * 
 * @param hex - Hex color string (e.g., "#FFFFFF", "#FFF", "FFFFFF")
 * @returns RGB object with r, g, b values (0-255)
 * @throws Error if hex string is invalid
 */
export function hexToRgb(hex: string): RGB {
  // Remove # if present
  const cleanHex = hex.replace(/^#/, '');
  
  // Handle 3-digit hex
  let fullHex = cleanHex;
  if (cleanHex.length === 3) {
    fullHex = cleanHex.split('').map(char => char + char).join('');
  }
  
  // Validate hex format
  if (!/^[0-9A-Fa-f]{6}$/.test(fullHex)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  
  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);
  
  return { r, g, b };
}

/**
 * Convert RGB to HSL
 * 
 * @param rgb - RGB object with r, g, b values (0-255)
 * @returns HSL object with h (0-360), s (0-100), l (0-100)
 */
export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / delta + 2) / 6;
        break;
      case b:
        h = ((r - g) / delta + 4) / 6;
        break;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Convert hex color to HSL
 * 
 * @param hex - Hex color string
 * @returns HSL object
 */
export function hexToHsl(hex: string): HSL {
  const rgb = hexToRgb(hex);
  return rgbToHsl(rgb);
}

/**
 * Convert HSL to RGB
 * 
 * @param hsl - HSL object with h (0-360), s (0-100), l (0-100)
 * @returns RGB object with r, g, b values (0-255)
 */
export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;
  
  let r: number, g: number, b: number;
  
  if (s === 0) {
    // Achromatic (gray)
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * Calculate relative luminance according to WCAG 2.1
 * 
 * The relative luminance is the relative brightness of any point in a colorspace,
 * normalized to 0 for darkest black and 1 for lightest white.
 * 
 * Formula: L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 * where R, G, B are calculated as:
 * - if RsRGB <= 0.03928 then R = RsRGB/12.92
 * - else R = ((RsRGB+0.055)/1.055) ^ 2.4
 * 
 * @param rgb - RGB object with r, g, b values (0-255)
 * @returns Relative luminance (0-1)
 */
export function getRelativeLuminance(rgb: RGB): number {
  // Convert RGB to sRGB (0-1 range)
  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;
  
  // Apply gamma correction
  const toLinear = (channel: number): number => {
    if (channel <= 0.03928) {
      return channel / 12.92;
    }
    return Math.pow((channel + 0.055) / 1.055, 2.4);
  };
  
  const r = toLinear(rsRGB);
  const g = toLinear(gsRGB);
  const b = toLinear(bsRGB);
  
  // Calculate relative luminance using WCAG coefficients
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors according to WCAG 2.1
 * 
 * Formula: (L1 + 0.05) / (L2 + 0.05)
 * where L1 is the relative luminance of the lighter color
 * and L2 is the relative luminance of the darker color
 * 
 * @param color1 - First color (hex string or RGB object)
 * @param color2 - Second color (hex string or RGB object)
 * @returns Contrast ratio (1-21)
 */
export function calculateContrastRatio(
  color1: string | RGB,
  color2: string | RGB
): number {
  const rgb1 = typeof color1 === 'string' ? hexToRgb(color1) : color1;
  const rgb2 = typeof color2 === 'string' ? hexToRgb(color2) : color2;
  
  const l1 = getRelativeLuminance(rgb1);
  const l2 = getRelativeLuminance(rgb2);
  
  // Ensure L1 is the lighter color
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  // Calculate contrast ratio
  const ratio = (lighter + 0.05) / (darker + 0.05);
  
  // Round to 2 decimal places
  return Math.round(ratio * 100) / 100;
}

/**
 * Validate contrast ratio against WCAG AA and AAA standards
 * 
 * WCAG AA: Minimum contrast ratio of 4.5:1 for normal text
 * WCAG AAA: Minimum contrast ratio of 7:1 for normal text
 * 
 * @param textColor - Text color (hex string or RGB object)
 * @param backgroundColor - Background color (hex string or RGB object)
 * @returns Contrast validation result
 */
export function validateDarkModeContrast(
  textColor: string | RGB,
  backgroundColor: string | RGB
): ContrastValidation {
  const ratio = calculateContrastRatio(textColor, backgroundColor);
  
  // WCAG AA minimum: 4.5:1
  const meetsAA = ratio >= 4.5;
  
  // WCAG AAA minimum: 7:1
  const meetsAAA = ratio >= 7.0;
  
  let level: 'AAA' | 'AA' | 'Fail';
  if (meetsAAA) {
    level = 'AAA';
  } else if (meetsAA) {
    level = 'AA';
  } else {
    level = 'Fail';
  }
  
  return {
    ratio,
    meetsAA,
    meetsAAA,
    level
  };
}

/**
 * Parse a CSS color string to RGB
 * Supports hex, rgb(), and rgba() formats
 * 
 * @param color - CSS color string
 * @returns RGB object or null if parsing fails
 */
export function parseColor(color: string): RGB | null {
  const trimmed = color.trim();
  
  // Try hex format
  if (trimmed.startsWith('#')) {
    try {
      return hexToRgb(trimmed);
    } catch {
      return null;
    }
  }
  
  // Try rgb/rgba format
  const rgbMatch = trimmed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10)
    };
  }
  
  return null;
}

/**
 * Format RGB to hex string
 * 
 * @param rgb - RGB object
 * @returns Hex color string with # prefix
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number): string => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

/**
 * Format HSL to CSS HSL string
 * 
 * @param hsl - HSL object
 * @returns CSS HSL string (e.g., "hsl(240, 100%, 50%)")
 */
export function hslToString(hsl: HSL): string {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}
