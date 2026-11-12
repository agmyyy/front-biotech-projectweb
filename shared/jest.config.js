/** Configuração do Jest para o pacote shared (schemas Zod + DTOs) */
module.exports = {
  testEnvironment: "node",
  // Varre apenas as pastas de fonte/testes; dist e node_modules ficam de fora
  roots: ["<rootDir>/schemas", "<rootDir>/dto", "<rootDir>/__tests__"],
  testMatch: ["<rootDir>/__tests__/**/*.spec.ts"],
  transform: {
    // O build do shared emite ESM/CJS via tsc, mas o Jest roda em CommonJS;
    // por isso module/moduleResolution são sobrescritos apenas durante o teste
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: {
          module: "commonjs",
          moduleResolution: "node",
          esModuleInterop: true,
        },
      },
    ],
  },
  // Limpa o histórico dos mocks entre os testes sem apagar as implementações
  clearMocks: true,
};
