const baseConfig = require("./jest.config");

/** Configuração do Jest para testes de integração (supertest) do backend */
module.exports = {
  ...baseConfig,
  // Integração mora em backend/test, separada dos unitários em backend/src
  roots: ["<rootDir>/test"],
  testMatch: ["**/*.e2e-spec.ts"],
};
