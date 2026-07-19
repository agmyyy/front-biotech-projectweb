import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["../shared"], // Mantém a transpilação da pasta compartilhada

  // Ativando o mapeamento explicitamente para o Turbopack resolver
  turbo: {
    aliases: {
      "@shared/*": ["../shared/*"],
    },
  },
};

export default nextConfig;
