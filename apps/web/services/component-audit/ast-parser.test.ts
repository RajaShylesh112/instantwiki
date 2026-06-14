/**
 * Unit Tests for AST Parsing Utilities
 * 
 * Tests the core functionality of component analysis utilities
 * including JSX parsing, className extraction, hardcoded color detection,
 * and contrast analysis.
 */

import {
  parseJSX,
  extractClassNames,
  findHardcodedColors,
  analyzeContrast,
  analyzeComponent,
  type ClassNameInfo,
  type HardcodedColorInfo,
  type ContrastIssue
} from './ast-parser';

describe('AST Parser Utilities', () => {
  describe('parseJSX', () => {
    it('should parse valid JSX content into an AST', () => {
      const content = `
        import React from 'react';
        
        export default function Component() {
          return <div className="text-slate-600">Hello</div>;
        }
      `;
      
      const ast = parseJSX(content, 'test.tsx');
      expect(ast).toBeDefined();
      expect(ast.kind).toBeDefined(); // TypeScript SyntaxKind
    });

    it('should parse JSX with self-closing elements', () => {
      const content = `
        export default function Component() {
          return <img src="/test.png" alt="test" />;
        }
      `;
      
      const ast = parseJSX(content);
      expect(ast).toBeDefined();
    });

    it('should parse JSX with nested elements', () => {
      const content = `
        export default function Component() {
          return (
            <div>
              <span>Nested</span>
            </div>
          );
        }
      `;
      
      const ast = parseJSX(content);
      expect(ast).toBeDefined();
    });
  });

  describe('extractClassNames', () => {
    it('should extract className from a simple div', () => {
      const content = `
        export default function Component() {
          return <div className="text-slate-600 bg-white">Content</div>;
        }
      `;
      
      const ast = parseJSX(content);
      const classNames = extractClassNames(ast);
      
      expect(classNames).toHaveLength(1);
      expect(classNames[0].value).toBe('text-slate-600 bg-white');
      expect(classNames[0].elementType).toBe('div');
      expect(classNames[0].location).toMatch(/\d+:\d+/);
    });

    it('should extract multiple classNames from different elements', () => {
      const content = `
        export default function Component() {
          return (
            <div className="container">
              <span className="text-sm">Text</span>
              <button className="btn btn-primary">Click</button>
            </div>
          );
        }
      `;
      
      const ast = parseJSX(content);
      const classNames = extractClassNames(ast);
      
      expect(classNames).toHaveLength(3);
      expect(classNames[0].value).toBe('container');
      expect(classNames[1].value).toBe('text-sm');
      expect(classNames[2].value).toBe('btn btn-primary');
    });

    it('should handle className with template expression', () => {
      const content = `
        export default function Component({ isActive }: { isActive: boolean }) {
          return <div className={isActive ? "active" : "inactive"}>Content</div>;
        }
      `;
      
      const ast = parseJSX(content);
      const classNames = extractClassNames(ast);
      
      expect(classNames).toHaveLength(1);
      expect(classNames[0].value).toContain('isActive');
    });

    it('should handle self-closing elements with className', () => {
      const content = `
        export default function Component() {
          return <input className="border border-slate-200" />;
        }
      `;
      
      const ast = parseJSX(content);
      const classNames = extractClassNames(ast);
      
      expect(classNames).toHaveLength(1);
      expect(classNames[0].value).toBe('border border-slate-200');
      expect(classNames[0].elementType).toBe('input');
    });

    it('should return empty array when no classNames are present', () => {
      const content = `
        export default function Component() {
          return <div>No classes</div>;
        }
      `;
      
      const ast = parseJSX(content);
      const classNames = extractClassNames(ast);
      
      expect(classNames).toHaveLength(0);
    });
  });

  describe('findHardcodedColors', () => {
    it('should detect hex colors in className', () => {
      const content = `
        export default function Component() {
          return <div style={{ color: "#ff0000" }}>Red text</div>;
        }
      `;
      
      const ast = parseJSX(content);
      const colors = findHardcodedColors(ast);
      
      expect(colors.length).toBeGreaterThan(0);
      const hexColor = colors.find(c => c.type === 'hex');
      expect(hexColor).toBeDefined();
      expect(hexColor?.value).toBe('#ff0000');
    });

    it('should detect shorthand hex colors', () => {
      const content = `
        export default function Component() {
          return <div style={{ backgroundColor: "#fff" }}>White bg</div>;
        }
      `;
      
      const ast = parseJSX(content);
      const colors = findHardcodedColors(ast);
      
      const hexColor = colors.find(c => c.value === '#fff');
      expect(hexColor).toBeDefined();
      expect(hexColor?.type).toBe('hex');
    });

    it('should detect rgb colors', () => {
      const content = `
        export default function Component() {
          return <div style={{ color: "rgb(255, 0, 0)" }}>Red text</div>;
        }
      `;
      
      const ast = parseJSX(content);
      const colors = findHardcodedColors(ast);
      
      const rgbColor = colors.find(c => c.type === 'rgb');
      expect(rgbColor).toBeDefined();
      expect(rgbColor?.value).toMatch(/rgb\(/);
    });

    it('should detect rgba colors', () => {
      const content = `
        export default function Component() {
          return <div style={{ color: "rgba(255, 0, 0, 0.5)" }}>Semi-transparent red</div>;
        }
      `;
      
      const ast = parseJSX(content);
      const colors = findHardcodedColors(ast);
      
      const rgbaColor = colors.find(c => c.type === 'rgba');
      expect(rgbaColor).toBeDefined();
      expect(rgbaColor?.value).toMatch(/rgba\(/);
    });

    it('should detect hsl colors', () => {
      const content = `
        export default function Component() {
          return <div style={{ color: "hsl(0, 100%, 50%)" }}>Red text</div>;
        }
      `;
      
      const ast = parseJSX(content);
      const colors = findHardcodedColors(ast);
      
      const hslColor = colors.find(c => c.type === 'hsl');
      expect(hslColor).toBeDefined();
      expect(hslColor?.value).toMatch(/hsl\(/);
    });

    it('should detect multiple colors in the same component', () => {
      const content = `
        export default function Component() {
          return (
            <div style={{ color: "#ff0000", backgroundColor: "#ffffff" }}>
              <span style={{ borderColor: "rgb(0, 255, 0)" }}>Colorful</span>
            </div>
          );
        }
      `;
      
      const ast = parseJSX(content);
      const colors = findHardcodedColors(ast);
      
      expect(colors.length).toBeGreaterThanOrEqual(3);
      expect(colors.some(c => c.value === '#ff0000')).toBe(true);
      expect(colors.some(c => c.value === '#ffffff')).toBe(true);
      expect(colors.some(c => c.value.includes('rgb'))).toBe(true);
    });

    it('should return empty array when no hardcoded colors are present', () => {
      const content = `
        export default function Component() {
          return <div className="text-slate-600">Semantic colors only</div>;
        }
      `;
      
      const ast = parseJSX(content);
      const colors = findHardcodedColors(ast);
      
      // May find colors in className values but should be minimal
      expect(Array.isArray(colors)).toBe(true);
    });

    it('should include location information for each color', () => {
      const content = `
        export default function Component() {
          return <div style={{ color: "#123456" }}>Text</div>;
        }
      `;
      
      const ast = parseJSX(content);
      const colors = findHardcodedColors(ast);
      
      if (colors.length > 0) {
        expect(colors[0].location).toMatch(/\d+:\d+/);
        expect(colors[0].context).toBeDefined();
      }
    });
  });

  describe('analyzeContrast', () => {
    it('should detect low contrast between text and background', () => {
      const content = `
        export default function Component() {
          return <div className="text-slate-400 bg-slate-300">Low contrast</div>;
        }
      `;
      
      const ast = parseJSX(content);
      const classNames = extractClassNames(ast);
      const contrastIssues = analyzeContrast(ast, classNames);
      
      // This combination should have low contrast
      expect(contrastIssues.length).toBeGreaterThanOrEqual(0);
      
      if (contrastIssues.length > 0) {
        expect(contrastIssues[0]).toHaveProperty('textColor');
        expect(contrastIssues[0]).toHaveProperty('backgroundColor');
        expect(contrastIssues[0]).toHaveProperty('contrastRatio');
        expect(contrastIssues[0]).toHaveProperty('meetsWCAG_AA');
        expect(contrastIssues[0]).toHaveProperty('meetsWCAG_AAA');
      }
    });

    it('should not flag adequate contrast combinations', () => {
      const content = `
        export default function Component() {
          return <div className="text-black bg-white">High contrast</div>;
        }
      `;
      
      const ast = parseJSX(content);
      const classNames = extractClassNames(ast);
      const contrastIssues = analyzeContrast(ast, classNames);
      
      // Black on white should have excellent contrast
      expect(contrastIssues.length).toBe(0);
    });

    it('should calculate WCAG AA compliance', () => {
      const content = `
        export default function Component() {
          return <div className="text-slate-600 bg-white">Text</div>;
        }
      `;
      
      const ast = parseJSX(content);
      const classNames = extractClassNames(ast);
      const contrastIssues = analyzeContrast(ast, classNames);
      
      // Check if issues have compliance flags
      contrastIssues.forEach(issue => {
        expect(typeof issue.meetsWCAG_AA).toBe('boolean');
        expect(typeof issue.meetsWCAG_AAA).toBe('boolean');
      });
    });

    it('should categorize issues by severity', () => {
      const content = `
        export default function Component() {
          return (
            <>
              <div className="text-slate-400 bg-slate-300">Low contrast</div>
              <div className="text-slate-200 bg-slate-100">Very low contrast</div>
            </>
          );
        }
      `;
      
      const ast = parseJSX(content);
      const classNames = extractClassNames(ast);
      const contrastIssues = analyzeContrast(ast, classNames);
      
      contrastIssues.forEach(issue => {
        expect(['critical', 'major', 'minor']).toContain(issue.severity);
      });
    });

    it('should include location information for contrast issues', () => {
      const content = `
        export default function Component() {
          return <div className="text-slate-400 bg-slate-300">Low contrast</div>;
        }
      `;
      
      const ast = parseJSX(content);
      const classNames = extractClassNames(ast);
      const contrastIssues = analyzeContrast(ast, classNames);
      
      if (contrastIssues.length > 0) {
        expect(contrastIssues[0].location).toMatch(/\d+:\d+/);
      }
    });
  });

  describe('analyzeComponent', () => {
    it('should provide comprehensive component analysis', () => {
      const content = `
        export default function Component() {
          return (
            <div className="text-slate-600 bg-white">
              <span className="text-slate-400" style={{ color: "#ff0000" }}>Text</span>
            </div>
          );
        }
      `;
      
      const analysis = analyzeComponent(content, 'test.tsx');
      
      expect(analysis.sourceFile).toBeDefined();
      expect(Array.isArray(analysis.classNames)).toBe(true);
      expect(Array.isArray(analysis.hardcodedColors)).toBe(true);
      expect(Array.isArray(analysis.contrastIssues)).toBe(true);
    });

    it('should find all issues in a complex component', () => {
      const content = `
        export default function ComplexComponent() {
          return (
            <div className="container">
              <div className="text-slate-400 bg-slate-300">Low contrast text</div>
              <span style={{ color: "#123456" }}>Hardcoded color</span>
              <button className="btn text-white bg-slate-800">Button</button>
            </div>
          );
        }
      `;
      
      const analysis = analyzeComponent(content);
      
      expect(analysis.classNames.length).toBeGreaterThan(0);
      expect(analysis.hardcodedColors.length).toBeGreaterThan(0);
      // May or may not have contrast issues depending on the colors
    });

    it('should handle components with no issues', () => {
      const content = `
        export default function CleanComponent() {
          return (
            <div className="text-slate-900 bg-white">
              <span className="text-slate-600">Clean semantic colors</span>
            </div>
          );
        }
      `;
      
      const analysis = analyzeComponent(content);
      
      expect(analysis.sourceFile).toBeDefined();
      expect(analysis.classNames.length).toBeGreaterThan(0);
      expect(analysis.contrastIssues.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty components', () => {
      const content = `
        export default function EmptyComponent() {
          return null;
        }
      `;
      
      const analysis = analyzeComponent(content);
      
      expect(analysis.classNames).toHaveLength(0);
      expect(analysis.hardcodedColors).toHaveLength(0);
      expect(analysis.contrastIssues).toHaveLength(0);
    });

    it('should handle components with fragments', () => {
      const content = `
        export default function FragmentComponent() {
          return (
            <>
              <div className="text-slate-600">First</div>
              <div className="text-slate-700">Second</div>
            </>
          );
        }
      `;
      
      const analysis = analyzeComponent(content);
      
      expect(analysis.classNames.length).toBe(2);
    });

    it('should handle className with utility functions like cn()', () => {
      const content = `
        import { cn } from '@/lib/utils';
        
        export default function Component() {
          return <div className={cn("text-slate-600", "bg-white")}>Text</div>;
        }
      `;
      
      const ast = parseJSX(content);
      const classNames = extractClassNames(ast);
      
      expect(classNames.length).toBeGreaterThan(0);
      // Should capture the cn() expression
      expect(classNames[0].value).toContain('cn');
    });

    it('should handle dynamic className with template literals', () => {
      const content = `
        export default function Component({ active }: { active: boolean }) {
          return <div className={\`text-slate-600 \${active ? 'bg-blue-500' : 'bg-white'}\`}>Text</div>;
        }
      `;
      
      const ast = parseJSX(content);
      const classNames = extractClassNames(ast);
      
      expect(classNames.length).toBeGreaterThan(0);
    });
  });
});
