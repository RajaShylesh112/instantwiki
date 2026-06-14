/**
 * AST Parsing Utilities for Component Analysis
 * 
 * This module provides utilities to parse React/TypeScript components
 * and extract styling information for dark mode analysis.
 * 
 * Validates Requirements: 1.1, 1.2, 9.1, 9.2
 */

import * as ts from 'typescript';

/**
 * Represents a className found in a component
 */
export interface ClassNameInfo {
  value: string;
  location: string; // line:column
  elementType: string;
}

/**
 * Represents a hardcoded color value found in code
 */
export interface HardcodedColorInfo {
  value: string;
  type: 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla';
  location: string; // line:column
  context: 'className' | 'style' | 'prop';
}

/**
 * Represents a contrast issue between text and background
 */
export interface ContrastIssue {
  textColor: string;
  backgroundColor: string;
  contrastRatio: number;
  location: string;
  severity: 'critical' | 'major' | 'minor';
  meetsWCAG_AA: boolean;
  meetsWCAG_AAA: boolean;
}

/**
 * Parse JSX/TSX content into an AST using TypeScript compiler API
 * 
 * Preconditions:
 * - content must be valid TypeScript/JSX code
 * - fileName should have .tsx or .jsx extension
 * 
 * Postconditions:
 * - Returns a TypeScript SourceFile AST
 * - AST can be traversed to extract component information
 * 
 * @param content - The JSX/TSX file content as a string
 * @param fileName - The file name (used for error reporting)
 * @returns TypeScript SourceFile AST
 */
export function parseJSX(content: string, fileName: string = 'component.tsx'): ts.SourceFile {
  return ts.createSourceFile(
    fileName,
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
}

/**
 * Extract all className attributes from JSX elements in the AST
 * 
 * Preconditions:
 * - sourceFile must be a valid TypeScript SourceFile
 * 
 * Postconditions:
 * - Returns array of all className values found
 * - Includes location information for each className
 * - Handles both string literals and template expressions
 * 
 * Loop Invariants:
 * - All visited JSX elements are checked for className attributes
 * - Each className is recorded exactly once
 * 
 * @param sourceFile - The TypeScript AST to analyze
 * @returns Array of className information
 */
export function extractClassNames(sourceFile: ts.SourceFile): ClassNameInfo[] {
  const classNames: ClassNameInfo[] = [];

  function visit(node: ts.Node) {
    // Check if this is a JSX element with attributes
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const attributes = ts.isJsxOpeningElement(node) 
        ? node.attributes.properties 
        : node.attributes.properties;

      const tagName = node.tagName.getText(sourceFile);
      
      for (const attr of attributes) {
        if (ts.isJsxAttribute(attr) && attr.name.getText(sourceFile) === 'className') {
          if (attr.initializer) {
            let classNameValue = '';
            
            if (ts.isStringLiteral(attr.initializer)) {
              classNameValue = attr.initializer.text;
            } else if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
              // Handle template strings, function calls, etc.
              classNameValue = attr.initializer.expression.getText(sourceFile);
            }

            if (classNameValue) {
              const { line, character } = sourceFile.getLineAndCharacterOfPosition(attr.getStart(sourceFile));
              classNames.push({
                value: classNameValue,
                location: `${line + 1}:${character + 1}`,
                elementType: tagName
              });
            }
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return classNames;
}

/**
 * Find all hardcoded color values (hex, rgb, rgba, hsl, hsla) in the AST
 * 
 * Preconditions:
 * - sourceFile must be a valid TypeScript SourceFile
 * 
 * Postconditions:
 * - Returns array of all hardcoded color values found
 * - Includes location and context for each color
 * - Detects colors in classNames, style props, and direct color props
 * 
 * @param sourceFile - The TypeScript AST to analyze
 * @returns Array of hardcoded color information
 */
export function findHardcodedColors(sourceFile: ts.SourceFile): HardcodedColorInfo[] {
  const colors: HardcodedColorInfo[] = [];
  
  // Regex patterns for different color formats
  const hexPattern = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
  const rgbPattern = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)/g;
  const hslPattern = /hsla?\(\s*\d+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*(?:,\s*[\d.]+\s*)?\)/g;

  function extractColorsFromText(text: string, context: 'className' | 'style' | 'prop', location: string) {
    // Find hex colors
    let match;
    while ((match = hexPattern.exec(text)) !== null) {
      colors.push({
        value: match[0],
        type: 'hex',
        location,
        context
      });
    }

    // Find rgb/rgba colors
    hexPattern.lastIndex = 0; // Reset regex
    while ((match = rgbPattern.exec(text)) !== null) {
      colors.push({
        value: match[0],
        type: match[0].includes('rgba') ? 'rgba' : 'rgb',
        location,
        context
      });
    }

    // Find hsl/hsla colors
    rgbPattern.lastIndex = 0; // Reset regex
    while ((match = hslPattern.exec(text)) !== null) {
      colors.push({
        value: match[0],
        type: match[0].includes('hsla') ? 'hsla' : 'hsl',
        location,
        context
      });
    }
  }

  function visit(node: ts.Node) {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    const location = `${line + 1}:${character + 1}`;

    // Check JSX attributes
    if (ts.isJsxAttribute(node)) {
      const attrName = node.name.getText(sourceFile);
      
      if (node.initializer) {
        let attrValue = '';
        
        if (ts.isStringLiteral(node.initializer)) {
          attrValue = node.initializer.text;
        } else if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
          attrValue = node.initializer.expression.getText(sourceFile);
        }

        const context = attrName === 'className' ? 'className' : 
                       attrName === 'style' ? 'style' : 'prop';
        
        extractColorsFromText(attrValue, context, location);
      }
    }

    // Check string literals (might contain color values)
    if (ts.isStringLiteral(node)) {
      extractColorsFromText(node.text, 'prop', location);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return colors;
}

/**
 * Calculate relative luminance according to WCAG 2.1 formula
 * 
 * @param r - Red channel (0-255)
 * @param g - Green channel (0-255)
 * @param b - Blue channel (0-255)
 * @returns Relative luminance (0-1)
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(channel => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors using WCAG 2.1 formula
 * 
 * @param color1Luminance - Relative luminance of first color
 * @param color2Luminance - Relative luminance of second color
 * @returns Contrast ratio (1-21)
 */
function calculateContrastRatio(color1Luminance: number, color2Luminance: number): number {
  const lighter = Math.max(color1Luminance, color2Luminance);
  const darker = Math.min(color1Luminance, color2Luminance);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Parse a hex color string to RGB values
 * 
 * @param hex - Hex color string (e.g., "#fff", "#ffffff")
 * @returns RGB object or null if invalid
 */
function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace('#', '');
  
  let r: number, g: number, b: number;
  
  if (cleaned.length === 3) {
    r = parseInt(cleaned[0] + cleaned[0], 16);
    g = parseInt(cleaned[1] + cleaned[1], 16);
    b = parseInt(cleaned[2] + cleaned[2], 16);
  } else if (cleaned.length === 6) {
    r = parseInt(cleaned.substring(0, 2), 16);
    g = parseInt(cleaned.substring(2, 4), 16);
    b = parseInt(cleaned.substring(4, 6), 16);
  } else {
    return null;
  }

  return { r, g, b };
}

/**
 * Parse Tailwind color class to approximate RGB values
 * This is a simplified approximation - actual values depend on Tailwind config
 * 
 * @param className - Tailwind class name (e.g., "text-slate-600")
 * @returns Approximate RGB values or null if not a color class
 */
function parseTailwindColor(className: string): { r: number; g: number; b: number } | null {
  // This is a simplified mapping - in a real implementation, 
  // you'd read from the actual Tailwind config
  const colorMap: Record<string, { r: number; g: number; b: number }> = {
    'white': { r: 255, g: 255, b: 255 },
    'black': { r: 0, g: 0, b: 0 },
    'slate-50': { r: 248, g: 250, b: 252 },
    'slate-100': { r: 241, g: 245, b: 249 },
    'slate-200': { r: 226, g: 232, b: 240 },
    'slate-300': { r: 203, g: 213, b: 225 },
    'slate-400': { r: 148, g: 163, b: 184 },
    'slate-500': { r: 100, g: 116, b: 139 },
    'slate-600': { r: 71, g: 85, b: 105 },
    'slate-700': { r: 51, g: 65, b: 85 },
    'slate-800': { r: 30, g: 41, b: 59 },
    'slate-900': { r: 15, g: 23, b: 42 },
    // Add more colors as needed
  };

  // Extract color from class like "text-slate-600" or "bg-white"
  const match = className.match(/(?:text|bg|border)-(\w+-?\d*)/);
  if (match && match[1]) {
    return colorMap[match[1]] || null;
  }

  return null;
}

/**
 * Analyze text and background color combinations for contrast issues
 * 
 * Preconditions:
 * - sourceFile must be a valid TypeScript SourceFile
 * - classNames array contains extracted className information
 * 
 * Postconditions:
 * - Returns array of contrast issues found
 * - Each issue includes contrast ratio and WCAG compliance
 * - Issues are categorized by severity
 * 
 * @param sourceFile - The TypeScript AST to analyze
 * @param classNames - Previously extracted className information
 * @returns Array of contrast issues
 */
export function analyzeContrast(
  sourceFile: ts.SourceFile,
  classNames: ClassNameInfo[]
): ContrastIssue[] {
  const issues: ContrastIssue[] = [];

  for (const classInfo of classNames) {
    const classes = classInfo.value.split(/\s+/);
    let textColor: string | null = null;
    let bgColor: string | null = null;

    // Extract text and background colors from class list
    for (const cls of classes) {
      if (cls.startsWith('text-')) {
        textColor = cls;
      } else if (cls.startsWith('bg-')) {
        bgColor = cls;
      }
    }

    // Only analyze if we have both text and background colors
    if (textColor && bgColor) {
      const textRgb = parseTailwindColor(textColor);
      const bgRgb = parseTailwindColor(bgColor);

      if (textRgb && bgRgb) {
        const textLuminance = getRelativeLuminance(textRgb.r, textRgb.g, textRgb.b);
        const bgLuminance = getRelativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
        const contrastRatio = calculateContrastRatio(textLuminance, bgLuminance);

        const meetsWCAG_AA = contrastRatio >= 4.5;
        const meetsWCAG_AAA = contrastRatio >= 7.0;

        if (!meetsWCAG_AA) {
          issues.push({
            textColor,
            backgroundColor: bgColor,
            contrastRatio,
            location: classInfo.location,
            severity: contrastRatio < 3.0 ? 'critical' : contrastRatio < 4.5 ? 'major' : 'minor',
            meetsWCAG_AA,
            meetsWCAG_AAA
          });
        }
      }
    }
  }

  return issues;
}

/**
 * Main entry point for component analysis
 * Combines all parsing utilities to provide comprehensive analysis
 * 
 * @param content - The JSX/TSX file content
 * @param fileName - The file name
 * @returns Comprehensive analysis result
 */
export function analyzeComponent(content: string, fileName: string = 'component.tsx') {
  const sourceFile = parseJSX(content, fileName);
  const classNames = extractClassNames(sourceFile);
  const hardcodedColors = findHardcodedColors(sourceFile);
  const contrastIssues = analyzeContrast(sourceFile, classNames);

  return {
    sourceFile,
    classNames,
    hardcodedColors,
    contrastIssues
  };
}
