/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Supabase Edge Functions 제외
    config.externals = config.externals || [];
    config.externals.push({
      'supabase/functions': 'commonjs supabase/functions',
    });
    
    return config;
  },
}

module.exports = nextConfig

