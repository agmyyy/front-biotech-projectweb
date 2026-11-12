/** Configuração do Jest para testes unitários do backend NestJS */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  // Testes unitários ficam ao lado do código que cobrem (padrão NestJS)
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.spec.ts"],
  moduleNameMapper: {
    // Aponta "shared" para o fonte: os testes rodam sem exigir o build do dist
    "^shared$": "<rootDir>/../shared/index.ts",
    "^shared/(.*)$": "<rootDir>/../shared/$1",
  },
  // Limpa o histórico dos mocks entre os testes sem apagar as implementações
  clearMocks: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    // main.ts só faz bootstrap e os módulos são apenas decorators
    "!src/main.ts",
    "!src/**/*.module.ts",
  ],
};
