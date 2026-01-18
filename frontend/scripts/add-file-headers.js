#!/usr/bin/env node

/**
 * Add File Headers Script
 *
 * Automatically adds JSDoc-style file headers to TypeScript/TSX files
 * that don't already have one.
 *
 * Usage: node scripts/add-file-headers.js
 *
 * @author Frontend Team
 * @created 2025-01-17
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/**
 * Standard file header template
 */
const getFileHeader = (filePath, fileType) => {
  const relativePath = path.relative(process.cwd(), filePath);
  const fileName = path.basename(filePath, fileType === "typescript" ? ".ts" : ".tsx");
  const componentName = fileName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");

  const date = new Date().toISOString().split("T")[0];

  if (fileType === "component") {
    return `/**
 * ${componentName} Component
 *
 * ${generateComponentDescription(fileName)}
 *
 * @fileoverview ${componentName} React component
 * @author Frontend Team
 * @created ${date}
 * @updated ${date}
 */
`;
  } else if (fileType === "page") {
    return `/**
 * ${fileName} Page
 *
 * Route page component for /${fileName.replace("page", "")}
 *
 * @fileoverview ${fileName} page component
 * @author Frontend Team
 * @created ${date}
 * @updated ${date}
 */
`;
  } else if (fileType === "layout") {
    return `/**
 * Layout Component
 *
 * Layout wrapper for ${fileName}
 *
 * @fileoverview Layout component
 * @author Frontend Team
 * @created ${date}
 * @updated ${date}
 */
`;
  } else if (fileType === "hook") {
    return `/**
 * ${componentName} Hook
 *
 * Custom React hook for ${generateHookDescription(fileName)}
 *
 * @fileoverview Custom React hook
 * @author Frontend Team
 * @created ${date}
 * @updated ${date}
 */
`;
  } else if (fileType === "utility") {
    return `/**
 * Utility Functions
 *
 * Helper functions for ${fileName}
 *
 * @fileoverview Utility functions
 * @author Frontend Team
 * @created ${date}
 * @updated ${date}
 */
`;
  } else {
    return `/**
 * ${fileName}
 *
 * @fileoverview TypeScript module
 * @author Frontend Team
 * @created ${date}
 * @updated ${date}
 */
`;
  }
};

/**
 * Generate component description based on filename
 */
const generateComponentDescription = (fileName) => {
  const descriptions = {
    sidebar: "Main navigation sidebar with collapsible menu items",
    topbar: "Top navigation bar with search and user menu",
    breadcrumb: "Breadcrumb navigation component",
    "command-palette": "Global command palette for quick navigation",
    "authenticated-layout": "Layout wrapper for authenticated pages",
    avatar: "User avatar component with fallback",
    button: "Button component with variants",
    input: "Input field component with validation",
    "dropdown-menu": "Dropdown menu component",
    dialog: "Modal dialog component",
    toast: "Toast notification component",
  };

  return descriptions[fileName] || "React component for UI functionality";
};

/**
 * Generate hook description based on filename
 */
const generateHookDescription = (fileName) => {
  const descriptions = {
    "use-command-palette": "Managing command palette state and keyboard shortcuts",
    "use-auth": "Authentication state and user session management",
    "use-media-query": "Responsive media query detection",
  };

  return descriptions[fileName] || "Custom React hook functionality";
};

/**
 * Check if file already has a header
 */
const hasFileHeader = (content) => {
  return content.trim().startsWith("/**");
};

/**
 * Determine file type based on path
 */
const getFileType = (filePath) => {
  if (filePath.includes("/components/") && filePath.endsWith(".tsx")) {
    return "component";
  }
  if (filePath.includes("/app/") && filePath.includes("/page.tsx")) {
    return "page";
  }
  if (filePath.includes("/app/") && filePath.includes("/layout.tsx")) {
    return "layout";
  }
  if (filePath.includes("/hooks/") || filePath.includes("use-")) {
    return "hook";
  }
  if (filePath.includes("/lib/") || filePath.includes("/utils/")) {
    return "utility";
  }
  return "typescript";
};

/**
 * Process a single file
 */
const processFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, "utf8");

    // Skip if already has header
    if (hasFileHeader(content)) {
      return { skipped: true, path: filePath };
    }

    // Determine file type
    const fileType = getFileType(filePath);

    // Generate header
    const header = getFileHeader(filePath, fileType);

    // Add header before existing content
    const newContent = header + content;

    // Write back
    fs.writeFileSync(filePath, newContent, "utf8");

    return { success: true, path: filePath, type: fileType };
  } catch (error) {
    return { error: true, path: filePath, message: error.message };
  }
};

/**
 * Main execution
 */
const main = () => {
  console.log("🔧 Adding file headers to TypeScript files...\n");

  // Find all .ts and .tsx files (excluding node_modules and .next)
  let files;
  try {
    const result = execSync(
      'find . -type f \\( -name "*.ts" -o -name "*.tsx" \\) ' +
        '! -path "./node_modules/*" ' +
        '! -path "./.next/*" ' +
        '! -path "./.git/*" ' +
        '! -name "*.d.ts" ' +
        '! -name "next-env.d.ts"',
      { encoding: "utf8", cwd: process.cwd() }
    );
    files = result.trim().split("\n").filter(Boolean);
  } catch (error) {
    console.error("❌ Error finding files:", error.message);
    process.exit(1);
  }

  console.log(`📁 Found ${files.length} TypeScript files\n`);

  // Process files
  const results = {
    success: [],
    skipped: [],
    errors: [],
  };

  for (const file of files) {
    const result = processFile(file);

    if (result.error) {
      results.errors.push(result);
    } else if (result.skipped) {
      results.skipped.push(result);
    } else {
      results.success.push(result);
    }
  }

  // Print results
  console.log("✅ Headers added:", results.success.length);
  console.log("⏭️  Skipped (already has header):", results.skipped.length);
  console.log("❌ Errors:", results.errors.length);

  if (results.errors.length > 0) {
    console.log("\n❌ Errors:");
    results.errors.forEach((err) => {
      console.log(`  ${err.path}: ${err.message}`);
    });
  }

  if (results.success.length > 0) {
    console.log(`\n✨ Successfully added headers to:`);
    results.success.slice(0, 10).forEach((result) => {
      console.log(`  ✓ ${result.path} (${result.type})`);
    });
    if (results.success.length > 10) {
      console.log(`  ... and ${results.success.length - 10} more`);
    }
  }

  console.log(`\n🎉 Complete!`);
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { processFile, getFileHeader, hasFileHeader };
