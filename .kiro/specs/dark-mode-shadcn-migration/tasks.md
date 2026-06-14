# Implementation Plan: Dark Mode Visibility Fixes & shadcn Component Migration

## Overview

This implementation plan breaks down the dark mode fixes and shadcn/ui component migration into discrete coding tasks. The approach follows a systematic workflow: first establishing the infrastructure for auditing and fixing, then executing the fixes, and finally migrating components to shadcn/ui equivalents. Each task builds on previous ones, with checkpoints to ensure incremental validation.

## Tasks

- [ ] 1. Set up audit infrastructure and color token system
  - [x] 1.1 Create ColorTokenManager service and registry
    - Implement `ColorTokenManager` class with registry, validation, and recommendation methods
    - Define `ColorToken`, `ColorCategory`, and `UsageGuideline` TypeScript interfaces
    - Create registry of all semantic tokens from `globals.css` with light/dark values
    - Implement `validateToken()`, `getRecommendedToken()`, and `listAvailableTokens()` methods
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 1.2 Write property test for ColorTokenManager
    - **Property 2: Color Token Consistency**
    - **Validates: Requirements 2.1, 2.3, 2.4**
    - Test that all tokens have both light and dark values
    - Test that token recommendations are deterministic for same context
    - Test that all recommended tokens exist in Tailwind config

  - [ ] 1.3 Implement contrast ratio calculation utilities
    - Create `calculateContrastRatio()` function using WCAG 2.1 formula
    - Implement `validateDarkModeContrast()` function with WCAG AA/AAA checks
    - Add color conversion helpers (hex to HSL, HSL to RGB)
    - Implement `getRelativeLuminance()` following WCAG specification
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 1.4 Write unit tests for contrast utilities
    - Test contrast ratio calculations with known color pairs
    - Test WCAG AA threshold validation (4.5:1)
    - Test WCAG AAA threshold validation (7:1)
    - Test edge cases (white/black, near-threshold values)
    - _Requirements: 6.1, 6.2, 6.3_

- [ ] 2. Build component audit service
  - [-] 2.1 Create AST parsing utilities for component analysis
    - Implement `parseJSX()` function using TypeScript compiler API
    - Create `extractClassNames()` to find all className attributes
    - Implement `findHardcodedColors()` to detect hex/rgb values in code
    - Create `analyzeContrast()` to evaluate text/background combinations
    - _Requirements: 1.1, 1.2, 9.1, 9.2_

  - [ ] 2.2 Implement ComponentAuditService with issue detection
    - Create `AuditService` class with `auditComponent()` method
    - Implement detection for missing dark mode variants
    - Implement detection for invisible text/border issues
    - Implement detection for low-contrast combinations
    - Calculate severity levels (critical, major, minor) for each issue
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ] 2.3 Implement auditAllComponents and report generation
    - Create `auditAllComponents()` function to scan entire codebase
    - Implement parallel processing for component audits
    - Create `generateAuditReport()` with prioritized issue list
    - Add support for incremental audits (cache unchanged files)
    - _Requirements: 1.5, 10.1, 10.3, 10.4_

  - [ ]* 2.4 Write property test for audit completeness
    - **Property 2: Color Token Consistency**
    - **Validates: Requirements 1.1, 1.2, 9.1, 9.3, 9.4**
    - Test that all color classes in components have dark variants or inherit properly
    - Test that no hardcoded colors exist without documentation

- [ ] 3. Checkpoint - Verify audit infrastructure
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement dark mode issue fixing
  - [ ] 4.1 Create dark mode fix application utilities
    - Implement `addDarkModeClass()` to insert dark: variants into className strings
    - Create `replaceTextColor()` to update text color classes
    - Create `replaceBorderColor()` to update border color classes
    - Implement `improveContrast()` to adjust low-contrast combinations
    - Add syntax validation using TypeScript compiler API
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ] 4.2 Implement fixDarkModeIssue function with rollback support
    - Create `fixDarkModeIssue()` function handling all issue types
    - Implement file backup before modifications
    - Add syntax validation before writing changes
    - Implement automatic rollback on validation failure
    - Add detailed error logging for failed fixes
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 7.4_

  - [ ]* 4.3 Write property test for contrast preservation
    - **Property 1: Dark Mode Visibility Preservation**
    - **Validates: Requirements 1.3, 3.4, 6.2**
    - Test that all fixes produce contrast ratios >= 4.5:1
    - Test that fixes preserve original functionality

  - [ ]* 4.4 Write unit tests for fix utilities
    - Test each fix type (missing-dark-variant, invisible-text, etc.)
    - Test rollback on syntax errors
    - Test that fixes don't affect non-color classes
    - _Requirements: 3.5, 3.6_

- [ ] 5. Execute dark mode fixes on identified components
  - [ ] 5.1 Run audit and generate prioritized issue list
    - Execute `auditAllComponents()` on entire codebase
    - Generate report with issues sorted by priority
    - Identify high-priority components (TopicCard, TopicTree, GraphPreview)
    - _Requirements: 1.5, 10.1, 10.2_

  - [ ] 5.2 Apply fixes to high-priority components
    - Fix dark mode issues in TopicCard component
    - Fix dark mode issues in TopicTree component
    - Fix dark mode issues in GraphPreview component
    - Validate contrast ratios after each fix
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.2_

  - [ ] 5.3 Apply fixes to medium and low-priority components
    - Process remaining components from audit report
    - Apply appropriate fixes based on issue type
    - Validate all changes maintain proper syntax
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 5.4 Run visual regression tests on fixed components
    - Test components in both light and dark modes
    - Verify contrast ratios meet WCAG AA standards
    - Check for any visual regressions
    - _Requirements: 6.2, 6.3_

- [ ] 6. Checkpoint - Verify all dark mode fixes
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Build component migration infrastructure
  - [ ] 7.1 Install required shadcn/ui components
    - Run `npx shadcn-ui@latest add card badge collapsible separator tooltip skeleton dialog select label switch`
    - Verify all components are properly installed
    - Check that components integrate with existing Tailwind config
    - _Requirements: 5.1_

  - [ ] 7.2 Create MigrationService with candidate identification
    - Implement `MigrationService` class with candidate identification
    - Create `identifyMigrationCandidates()` method
    - Implement `hasShadcnEquivalent()` to map custom to shadcn components
    - Define prop and style mapping structures
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 7.3 Implement migration execution functions
    - Create `migrateToShadcn()` function for component migration
    - Implement `findComponentUsages()` to locate all usages
    - Create `updateComponentUsage()` to update imports and props
    - Implement `createAdapter()` for components needing prop bridging
    - Add backup and rollback mechanisms
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 7.1, 7.2, 7.3_

  - [ ]* 7.4 Write property test for migration completeness
    - **Property 3: Migration Completeness**
    - **Validates: Requirements 5.2, 5.3, 5.4, 5.6**
    - Test that all usages are updated after migration
    - Test that functionality remains identical post-migration

  - [ ]* 7.5 Write unit tests for migration utilities
    - Test prop mapping transformations
    - Test import statement updates
    - Test adapter component creation
    - Test rollback on validation failure
    - _Requirements: 5.4, 5.7, 7.3, 7.4, 7.5_

- [ ] 8. Execute component migrations
  - [ ] 8.1 Migrate simple components (CustomLink, status badges)
    - Migrate CustomLink to shadcn Button with Link
    - Migrate custom badges to shadcn Badge
    - Update all usages across codebase
    - Validate prop compatibility
    - _Requirements: 5.2, 5.3, 5.4, 8.1, 8.2_

  - [ ] 8.2 Migrate moderate complexity components (cards, collapsibles)
    - Migrate custom card components to shadcn Card
    - Update collapsible sections to use shadcn Collapsible
    - Create adapters if needed for prop compatibility
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 8.3, 8.4_

  - [ ] 8.3 Migrate complex components with adapters if needed
    - Migrate remaining custom components
    - Create adapter components for incompatible prop signatures
    - Ensure all consuming components continue to function
    - _Requirements: 5.5, 5.6, 8.3, 8.4, 8.5_

  - [ ]* 8.4 Write integration tests for migrated components
    - Test component interactions post-migration
    - Test props flow through component hierarchy
    - Test event handlers function correctly
    - _Requirements: 5.6, 8.1, 8.2_

- [ ] 9. Validate and test complete migration
  - [ ] 9.1 Run full audit to verify no dark mode issues remain
    - Execute `auditAllComponents()` on entire codebase
    - Verify all contrast ratios meet WCAG AA standards
    - Confirm all components use semantic tokens
    - _Requirements: 9.1, 9.3, 9.4, 10.1_

  - [ ]* 9.2 Run property-based tests on complete codebase
    - **Property 1: Dark Mode Visibility Preservation**
    - **Property 2: Color Token Consistency**
    - **Property 3: Migration Completeness**
    - **Property 4: No Hardcoded Colors**
    - **Property 5: Backward Compatibility**
    - **Validates: Multiple requirements across all user stories**

  - [ ]* 9.3 Perform visual regression testing
    - Test all pages in light and dark modes
    - Verify no visual regressions from migrations
    - Check responsive behavior across viewport sizes
    - _Requirements: 6.2, 6.3, 6.5_

  - [ ] 9.4 Generate comprehensive migration report
    - Generate report with total issues fixed
    - List all migrated components
    - Document any skipped components with reasons
    - Include before/after metrics for contrast and token usage
    - List components flagged for manual review
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 10. Final checkpoint - Complete validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The design uses TypeScript for all implementations
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout the process
- Property tests validate universal correctness properties from the design
- Unit tests validate specific examples and edge cases
- All dark mode fixes use semantic color tokens from the existing Tailwind config
- Component migrations maintain backward compatibility through adapters when needed
- The migration process includes comprehensive backup and rollback mechanisms

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "7.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["1.4", "2.1"] },
    { "id": 3, "tasks": ["2.2", "7.2"] },
    { "id": 4, "tasks": ["2.3", "2.4"] },
    { "id": 5, "tasks": ["4.1", "7.3"] },
    { "id": 6, "tasks": ["4.2", "4.3", "7.4"] },
    { "id": 7, "tasks": ["4.4", "7.5"] },
    { "id": 8, "tasks": ["5.1"] },
    { "id": 9, "tasks": ["5.2"] },
    { "id": 10, "tasks": ["5.3", "5.4"] },
    { "id": 11, "tasks": ["8.1"] },
    { "id": 12, "tasks": ["8.2"] },
    { "id": 13, "tasks": ["8.3", "8.4"] },
    { "id": 14, "tasks": ["9.1", "9.2", "9.3"] },
    { "id": 15, "tasks": ["9.4"] }
  ]
}
```
