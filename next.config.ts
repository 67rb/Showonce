/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
import type { NextConfig } from "next";
import {PHASE_DEVELOPMENT_SERVER} from "next/constants";

export default function configuration(phase:string):NextConfig {
const nextConfig: NextConfig = {
  output: phase===PHASE_DEVELOPMENT_SERVER?undefined:"export",
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

if(phase===PHASE_DEVELOPMENT_SERVER)nextConfig.rewrites=async()=>[
 {source:'/api/:path*',destination:'http://127.0.0.1:8026/api/:path*'},
 {source:'/v1/:path*',destination:'http://127.0.0.1:8026/v1/:path*'},
 {source:'/health',destination:'http://127.0.0.1:8026/health'},
 {source:'/studio',destination:'http://127.0.0.1:8026/studio'},
 {source:'/team.html',destination:'http://127.0.0.1:8026/team.html'},
 {source:'/team.js',destination:'http://127.0.0.1:8026/team.js'},
 {source:'/team.css',destination:'http://127.0.0.1:8026/team.css'},
 {source:'/styles.css',destination:'http://127.0.0.1:8026/styles.css'},
 {source:'/app.js',destination:'http://127.0.0.1:8026/app.js'},
 {source:'/fixtures/:path*',destination:'http://127.0.0.1:8026/fixtures/:path*'},
 {source:'/examples/:path*',destination:'http://127.0.0.1:8026/examples/:path*'},
 {source:'/public-api.js',destination:'http://127.0.0.1:8026/public-api.js'}
];
return nextConfig;
}
