#!/usr/bin/env node

/**
 * Remove Inline Styles Script
 *
 * Finds and reports inline styles in TSX files.
 * Manual review required to replace with Tailwind classes.
 *
 * Usage: node scripts/remove-inline-styles.js
 *
 * @author Frontend Team
 * @created 2025-01-17
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Inline style patterns to find
 */
const INLINE_STYLE_PATTERNS = [
  { pattern: /style=\{\{\s*height:\s*([^}]+)\s*\}\}/g, tailwind: 'h-[VALUE]' },
  { pattern: /style=\{\{\s*width:\s*([^}]+)\s*\}\}/g, tailwind: 'w-[VALUE]' },
  { pattern: /style=\{\{\s*paddingLeft:\s*([^}]+)\s*\}\}/g, tailwind: 'pl-[VALUE]' },
  { pattern: /style=\{\{\s*paddingRight:\s*([^}]+)\s*\}\}/g, tailwind: 'pr-[VALUE]' },
  { pattern: /style=\{\{\s*marginTop:\s*([^}]+)\s*\}\}/g, tailwind: 'mt-[VALUE]' },
  { pattern: /style=\{\{\s*marginBottom:\s*([^}]+)\s*\}\}/g, tailwind: 'mb-[VALUE]' },
  { pattern: /style=\{\{\s*display:\s*['"]flex['"]\s*\}\}/g, tailwind: 'flex' },
  { pattern: /style=\{\{\s*display:\s*['"]grid['"]\s*\}\}/g, tailwind: 'grid' },
  { pattern: /style=\{\{\s*justifyContent:\s*['"]center['"]\s*\}\}/g, tailwind: 'justify-center' },
  { pattern: /style=\{\{\s*alignItems:\s*['"]center['"]\s*\}\}/g, tailwind: 'items-center' },
];

/**
 * Common inline style replacements
 */
const REPLACEMENTS = {
  'display: "flex"': 'flex',
  'display: "grid"': 'grid',
  'display: flex': 'flex',
  'display: grid': 'grid',
  'justifyContent: "center"': 'justify-center',
  'justifyContent: center': 'justify-center',
  'alignItems: "center"': 'items-center',
  'alignItems: center': 'items-center',
  'flexDirection: "column"': 'flex-col',
  'flexDirection: column': 'flex-col',
  'flexDirection: "row"': 'flex-row',
  'flexDirection: row': 'flex-row',
  'gap: ' : 'gap-',
};

/**
 * Find all inline styles in a file
 */
const findInlineStyles = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const findings = [];

  lines.forEach((line, index) => {
    // Match style={{ ... }}
    const styleMatch = line.match(/style=\{\{([^}]+)\}\}/g);
    if (styleMatch) {
      findings.push({
        line: index + 1,
        content: line.trim(),
        styles: styleMatch,
      });
    }
  });

  return findings;
};

/**
 * Generate replacement suggestions
 */
const generateReplacements = (styleString) => {
  const suggestions = [];

  // Extract style object
  const match = styleString.match(/style=\{\{(.+?)\}\}/);
  if (!match) return suggestions;

  const styleContent = match[1];

  // Parse common properties
  if (styleContent.includes('display')) {
    const displayMatch = styleContent.match(/display:\s*['"]?(\w+)['"]?/);
    if (displayMatch) {
      const display = displayMatch[1];
      if (display === 'flex') suggestions.push('flex');
      if (display === 'grid') suggestions.push('grid');
      if (display === 'block') suggestions.push('block');
      if (display === 'inline') suggestions.push('inline');
    }
  }

  if (styleContent.includes('justifyContent')) {
    const justifyMatch = styleContent.match(/justifyContent:\s*['"]?(\w+)['"]?/);
    if (justifyMatch) {
      suggestions.push(`justify-${justifyMatch[1]}`);
    }
  }

  if (styleContent.includes('alignItems')) {
    const alignMatch = styleContent.match(/alignItems:\s*['"]?(\w+)['"]?/);
    if (alignMatch) {
      suggestions.push(`items-${alignMatch[1]}`);
    }
  }

  if (styleContent.includes('flexDirection')) {
    const dirMatch = styleContent.match(/flexDirection:\s*['"]?(\w+)['"]?/);
    if (dirMatch) {
      const dir = dirMatch[1];
      if (dir === 'column') suggestions.push('flex-col');
      if (dir === 'row') suggestions.push('flex-row');
    }
  }

  // Check for dynamic values
  if (styleContent.includes('height:')) {
    const heightMatch = styleContent.match(/height:\s*['"`]?(\d+(?:\.\d+)?)\s*(px|%|em|rem)?['"`]?/);
    if (heightMatch) {
      const value = heightMatch[1];
      const unit = heightMatch[2] || 'px';
      suggestions.push(`h-[${value}${unit}]`);
    }
  }

  if (styleContent.includes('width:')) {
    const widthMatch = styleContent.match(/width:\s*['"`]?(\d+(?:\.\d+)?)\s*(px|%|em|rem)?['"`]?/);
    if (widthMatch) {
      const value = widthMatch[1];
      const unit = widthMatch[2] || 'px';
      suggestions.push(`w-[${value}${unit}]`);
    }
  }

  if (styleContent.includes('paddingLeft')) {
    const padMatch = styleContent.match(/paddingLeft:\s*['"`]?(\d+(?:\.\d+)?)\s*(px|%|em|rem)?['"`]?/);
    if (padMatch) {
      const value = padMatch[1];
      const unit = padMatch[2] || 'px';
      suggestions.push(`pl-[${value}${unit}]`);
    }
  }

  if (styleContent.includes('position:')) {
    const posMatch = styleContent.match(/position:\s*['"]?(\w+)['"]?/);
    if (posMatch) {
      suggestions.push(`position-${posMatch[1]}`);
    }
  }

  return suggestions;
};

/**
 * Process a single file
 */
const processFile = (filePath) => {
  const findings = findInlineStyles(filePath);

  if (findings.length === 0) {
    return { clean: true, path: filePath };
  }

  const results = [];

  findings.forEach(finding => {
    finding.styles.forEach(style => {
      const suggestions = generateReplacements(style);
      results.push({
        line: finding.line,
        content: finding.content,
        style: style,
        suggestions: suggestions,
      });
    });
  });

  return { hasInlineStyles: true, path: filePath, results };
};

/**
 * Main execution
 */
const main = () => {
  console.log('🔍 Searching for inline styles...\n');

  // Find all .tsx files
  let files;
  try {
    const result = execSync(
      'find ./components ./app -type f -name "*.tsx" 2>/dev/null',
      { encoding: 'utf8', cwd: process.cwd() }
    );
    files = result.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.error('❌ Error finding files:', error.message);
    process.exit(1);
  }

  console.log(`📁 Found ${files.length} TSX files\n`);

  // Process files
  const results = {
    clean: [],
    hasInlineStyles: [],
  };

  for (const file of files) {
    try {
      const result = processFile(file);
      if (result.hasInlineStyles) {
        results.hasInlineStyles.push(result);
      } else {
        results.clean.push(result);
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }

  // Print results
  console.log('✅ Clean files (no inline styles):', results.clean.length);
  console.log('⚠️  Files with inline styles:', results.hasInlineStyles.length);

  if (results.hasInlineStyles.length > 0) {
    console.log('\n⚠️  Files with inline styles:\n');

    results.hasInlineStyles.forEach(fileResult => {
      console.log(`\n📄 ${fileResult.path}`);
      fileResult.results.forEach(result => {
        console.log(`   Line ${result.line}:`);
        console.log(`   ${result.content}`);
        if (result.suggestions.length > 0) {
          console.log(`   💡 Suggestion: className="${result.suggestions.join(' ')}"`);
        } else {
          console.log(`   ⚠️  Manual review needed for complex styles`);
        }
      });
    });

    console.log('\n📝 Common Tailwind replacements:');
    console.log('   display: flex → className="flex"');
    console.log('   justifyContent: center → className="justify-center"');
    console.log('   alignItems: center → className="items-center"');
    console.log('   height: 400px → className="h-[400px]"');
    console.log('   width: 100% → className="w-full"');
    console.log('   paddingLeft: 20px → className="pl-5"');
    console.log('   position: relative → className="relative"');

    console.log('\n📚 For complex dynamic values, use:');
    console.log('   style={{ height: dynamicValue }}');
    console.log('   → className="h-[400px]" (if static)');
    console.log('   → style={{ height }} (keep if truly dynamic)');
  }

  console.log(`\n🎉 Analysis complete!`);
  console.log(`\n📌 Next steps:`);
  console.log(`   1. Review files with inline styles`);
  console.log(`   2. Replace with Tailwind classes where possible`);
  console.log(`   3. Use cn() helper for conditional classes`);
  console.log(`   4. Only keep inline styles for truly dynamic values`);
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { processFile, findInlineStyles, generateReplacements };
