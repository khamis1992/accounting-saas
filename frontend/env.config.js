/**
 * Environment Configuration Validation
 * Run during build time to validate all required environment variables
 */

// Required environment variables for the application
const requiredEnvVars = {
  // Supabase configuration
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,

  // API configuration
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
};

// Optional environment variables (with defaults)
const optionalEnvVars = {
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "المحاسب",
};

// Check for missing required environment variables
const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value || value.trim() === "")
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  console.error("❌ Missing required environment variables:");
  missingEnvVars.forEach((varName) => {
    console.error(`  - ${varName}`);
  });
  console.error("\nPlease set these variables in .env.local or your deployment platform.\n");

  // Provide helpful error message
  console.error("Example .env.local configuration:");
  console.error("NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co");
  console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key");
  console.error("NEXT_PUBLIC_API_URL=http://localhost:3001/api");
  console.error("NEXT_PUBLIC_APP_URL=http://localhost:3000\n");

  process.exit(1);
}

// Log configuration status (without exposing sensitive values)
console.log("✅ Environment configuration validated");
console.log(
  `  - Supabase URL: ${requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL ? "✓ Set" : "✗ Missing"}`
);
console.log(
  `  - Supabase Anon Key: ${requiredEnvVars.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Set" : "✗ Missing"}`
);
console.log(`  - API URL: ${requiredEnvVars.NEXT_PUBLIC_API_URL || "✗ Missing"}`);
console.log(`  - App URL: ${requiredEnvVars.NEXT_PUBLIC_APP_URL || "✗ Missing"}`);
console.log(`  - App Name: ${optionalEnvVars.NEXT_PUBLIC_APP_NAME}\n`);

// Export validated variables for use in next.config.js
module.exports = {
  required: requiredEnvVars,
  optional: optionalEnvVars,
};
