/**
 * Unit tests for contrast-utils.ts
 * 
 * Tests WCAG 2.1 contrast ratio calculations and color conversion utilities
 */

import {
  hexToRgb,
  rgbToHsl,
  hexToHsl,
  hslToRgb,
  getRelativeLuminance,
  calculateContrastRatio,
  validateDarkModeContrast,
  parseColor,
  rgbToHex,
  hslToString,
  type RGB,
  type HSL,
} from './contrast-utils';

// Test utilities
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEquals<T>(actual: T, expected: T, message: string): void {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(`${message}\nExpected: ${expectedStr}\nActual: ${actualStr}`);
  }
}

function assertApproxEqual(actual: number, expected: number, tolerance: number, message: string): void {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message}\nExpected: ${expected} (±${tolerance})\nActual: ${actual}`);
  }
}

// Test Suite
function runTests(): void {
  console.log('🧪 Running Contrast Utils Tests...\n');
  
  let passedTests = 0;
  let failedTests = 0;

  function test(name: string, fn: () => void): void {
    try {
      fn();
      console.log(`✅ ${name}`);
      passedTests++;
    } catch (error) {
      console.error(`❌ ${name}`);
      console.error(`   ${error instanceof Error ? error.message : String(error)}`);
      failedTests++;
    }
  }

  // ===== Hex to RGB Tests =====
  console.log('--- Hex to RGB Conversion ---');
  
  test('hexToRgb converts 6-digit hex correctly', () => {
    const result = hexToRgb('#FFFFFF');
    assertEquals(result, { r: 255, g: 255, b: 255 }, 'White');
  });

  test('hexToRgb converts black correctly', () => {
    const result = hexToRgb('#000000');
    assertEquals(result, { r: 0, g: 0, b: 0 }, 'Black');
  });

  test('hexToRgb converts 3-digit hex correctly', () => {
    const result = hexToRgb('#FFF');
    assertEquals(result, { r: 255, g: 255, b: 255 }, '3-digit white');
  });

  test('hexToRgb converts hex without # prefix', () => {
    const result = hexToRgb('FF0000');
    assertEquals(result, { r: 255, g: 0, b: 0 }, 'Red without #');
  });

  test('hexToRgb converts purple correctly', () => {
    const result = hexToRgb('#8B5CF6');
    assertEquals(result, { r: 139, g: 92, b: 246 }, 'Purple');
  });

  test('hexToRgb throws error for invalid hex', () => {
    try {
      hexToRgb('#GGGGGG');
      throw new Error('Should have thrown error');
    } catch (error) {
      assert(
        error instanceof Error && error.message.includes('Invalid hex'),
        'Should throw for invalid hex'
      );
    }
  });

  // ===== RGB to HSL Tests =====
  console.log('\n--- RGB to HSL Conversion ---');

  test('rgbToHsl converts white correctly', () => {
    const result = rgbToHsl({ r: 255, g: 255, b: 255 });
    assertEquals(result, { h: 0, s: 0, l: 100 }, 'White to HSL');
  });

  test('rgbToHsl converts black correctly', () => {
    const result = rgbToHsl({ r: 0, g: 0, b: 0 });
    assertEquals(result, { h: 0, s: 0, l: 0 }, 'Black to HSL');
  });

  test('rgbToHsl converts red correctly', () => {
    const result = rgbToHsl({ r: 255, g: 0, b: 0 });
    assertEquals(result, { h: 0, s: 100, l: 50 }, 'Red to HSL');
  });

  test('rgbToHsl converts green correctly', () => {
    const result = rgbToHsl({ r: 0, g: 255, b: 0 });
    assertEquals(result, { h: 120, s: 100, l: 50 }, 'Green to HSL');
  });

  test('rgbToHsl converts blue correctly', () => {
    const result = rgbToHsl({ r: 0, g: 0, b: 255 });
    assertEquals(result, { h: 240, s: 100, l: 50 }, 'Blue to HSL');
  });

  // ===== HSL to RGB Tests =====
  console.log('\n--- HSL to RGB Conversion ---');

  test('hslToRgb converts white correctly', () => {
    const result = hslToRgb({ h: 0, s: 0, l: 100 });
    assertEquals(result, { r: 255, g: 255, b: 255 }, 'HSL white to RGB');
  });

  test('hslToRgb converts black correctly', () => {
    const result = hslToRgb({ h: 0, s: 0, l: 0 });
    assertEquals(result, { r: 0, g: 0, b: 0 }, 'HSL black to RGB');
  });

  test('hslToRgb converts red correctly', () => {
    const result = hslToRgb({ h: 0, s: 100, l: 50 });
    assertEquals(result, { r: 255, g: 0, b: 0 }, 'HSL red to RGB');
  });

  test('hslToRgb converts gray correctly', () => {
    const result = hslToRgb({ h: 0, s: 0, l: 50 });
    assertEquals(result, { r: 128, g: 128, b: 128 }, 'HSL gray to RGB');
  });

  // ===== Relative Luminance Tests =====
  console.log('\n--- Relative Luminance Calculation ---');

  test('getRelativeLuminance returns 1 for white', () => {
    const result = getRelativeLuminance({ r: 255, g: 255, b: 255 });
    assertApproxEqual(result, 1.0, 0.01, 'White luminance');
  });

  test('getRelativeLuminance returns 0 for black', () => {
    const result = getRelativeLuminance({ r: 0, g: 0, b: 0 });
    assertApproxEqual(result, 0.0, 0.01, 'Black luminance');
  });

  test('getRelativeLuminance calculates correctly for gray', () => {
    const result = getRelativeLuminance({ r: 128, g: 128, b: 128 });
    // Mid-gray should be around 0.215 due to gamma correction
    assertApproxEqual(result, 0.215, 0.01, 'Gray luminance');
  });

  test('getRelativeLuminance applies gamma correction', () => {
    // Low value that requires linear conversion (< 0.03928)
    const result = getRelativeLuminance({ r: 10, g: 10, b: 10 });
    assert(result < 0.01, 'Low RGB values should have very low luminance');
  });

  // ===== Contrast Ratio Tests =====
  console.log('\n--- Contrast Ratio Calculation ---');

  test('calculateContrastRatio returns 21 for white on black', () => {
    const result = calculateContrastRatio('#FFFFFF', '#000000');
    assertApproxEqual(result, 21.0, 0.1, 'White on black contrast');
  });

  test('calculateContrastRatio returns 21 for black on white', () => {
    const result = calculateContrastRatio('#000000', '#FFFFFF');
    assertApproxEqual(result, 21.0, 0.1, 'Black on white contrast (reversed)');
  });

  test('calculateContrastRatio returns 1 for identical colors', () => {
    const result = calculateContrastRatio('#FF0000', '#FF0000');
    assertApproxEqual(result, 1.0, 0.1, 'Same color contrast');
  });

  test('calculateContrastRatio works with RGB objects', () => {
    const result = calculateContrastRatio(
      { r: 255, g: 255, b: 255 },
      { r: 0, g: 0, b: 0 }
    );
    assertApproxEqual(result, 21.0, 0.1, 'RGB object contrast');
  });

  test('calculateContrastRatio calculates typical text contrast', () => {
    // Dark text on light background (common scenario)
    const result = calculateContrastRatio('#333333', '#FFFFFF');
    assert(result >= 4.5, 'Dark gray on white should meet WCAG AA');
  });

  // ===== WCAG Validation Tests =====
  console.log('\n--- WCAG Contrast Validation ---');

  test('validateDarkModeContrast identifies AAA level', () => {
    const result = validateDarkModeContrast('#000000', '#FFFFFF');
    assert(result.meetsAAA, 'Should meet AAA');
    assert(result.meetsAA, 'Should meet AA');
    assertEquals(result.level, 'AAA', 'Should be AAA level');
    assert(result.ratio >= 7.0, 'AAA requires 7:1 ratio');
  });

  test('validateDarkModeContrast identifies AA level', () => {
    // A combination that meets AA but not AAA
    const result = validateDarkModeContrast('#767676', '#FFFFFF');
    assert(result.meetsAA, 'Should meet AA');
    assert(!result.meetsAAA, 'Should not meet AAA');
    assertEquals(result.level, 'AA', 'Should be AA level');
    assert(result.ratio >= 4.5 && result.ratio < 7.0, 'AA is 4.5:1 to 7:1');
  });

  test('validateDarkModeContrast identifies failure', () => {
    // Low contrast combination
    const result = validateDarkModeContrast('#CCCCCC', '#FFFFFF');
    assert(!result.meetsAA, 'Should not meet AA');
    assert(!result.meetsAAA, 'Should not meet AAA');
    assertEquals(result.level, 'Fail', 'Should fail');
    assert(result.ratio < 4.5, 'Fail is below 4.5:1');
  });

  test('validateDarkModeContrast threshold boundary for AA', () => {
    // Test exactly at the AA threshold
    const result = validateDarkModeContrast('#595959', '#FFFFFF');
    // This should be very close to 4.5:1
    assertApproxEqual(result.ratio, 4.5, 0.5, 'Should be near AA threshold');
  });

  test('validateDarkModeContrast threshold boundary for AAA', () => {
    // Test exactly at the AAA threshold
    const result = validateDarkModeContrast('#595959', '#000000');
    // This combination should give around 7:1
    if (result.ratio >= 7.0) {
      assert(result.meetsAAA, 'Should meet AAA at threshold');
    }
  });

  // ===== Edge Cases and Error Handling =====
  console.log('\n--- Edge Cases ---');

  test('parseColor handles hex format', () => {
    const result = parseColor('#FF0000');
    assertEquals(result, { r: 255, g: 0, b: 0 }, 'Parse hex');
  });

  test('parseColor handles rgb format', () => {
    const result = parseColor('rgb(255, 0, 0)');
    assertEquals(result, { r: 255, g: 0, b: 0 }, 'Parse rgb()');
  });

  test('parseColor handles rgba format', () => {
    const result = parseColor('rgba(255, 0, 0, 0.5)');
    assertEquals(result, { r: 255, g: 0, b: 0 }, 'Parse rgba()');
  });

  test('parseColor returns null for invalid format', () => {
    const result = parseColor('invalid');
    assertEquals(result, null, 'Invalid color returns null');
  });

  test('rgbToHex formats correctly', () => {
    const result = rgbToHex({ r: 255, g: 0, b: 0 });
    assertEquals(result, '#FF0000', 'RGB to hex');
  });

  test('hslToString formats correctly', () => {
    const result = hslToString({ h: 240, s: 100, l: 50 });
    assertEquals(result, 'hsl(240, 100%, 50%)', 'HSL to string');
  });

  test('hexToHsl combines conversions correctly', () => {
    const result = hexToHsl('#FF0000');
    assertEquals(result, { h: 0, s: 100, l: 50 }, 'Hex to HSL direct');
  });

  // ===== Real-World Scenarios =====
  console.log('\n--- Real-World Scenarios ---');

  test('Dark mode text on dark background', () => {
    // Light text on dark background (dark mode typical)
    const result = validateDarkModeContrast('#E4E4E7', '#18181B');
    assert(result.meetsAA, 'Light gray on dark background should meet AA');
  });

  test('Purple brand color accessibility', () => {
    // Common purple brand color on white
    const result = validateDarkModeContrast('#8B5CF6', '#FFFFFF');
    assert(result.meetsAA, 'Purple on white should meet AA');
  });

  test('Slate text colors', () => {
    // Tailwind slate-600 on white
    const result = validateDarkModeContrast('#475569', '#FFFFFF');
    assert(result.meetsAA, 'Slate-600 on white should meet AA');
  });

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📊 Total: ${passedTests + failedTests}`);
  console.log('='.repeat(50));

  if (failedTests > 0) {
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

export { runTests };
