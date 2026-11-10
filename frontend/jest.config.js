const nextJest = require("next/jest");

// Carrega next.config.ts e os arquivos .env do frontend para os testes
const createJestConfig = nextJest({ dir: "./" });

/** Configuração do Jest para o frontend (Next.js + React) */
const customJestConfig = {
  // jsdom simula o navegador: necessário para componentes, hooks e localStorage
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    // Espelha os aliases do tsconfig.json para o Jest resolver os mesmos caminhos
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@shared/(.*)$": "<rootDir>/../shared/$1",
  },
  // Limpa o histórico dos mocks entre os testes sem apagar as implementações
  clearMocks: true,
};

// next/jest é assíncrono porque lê o next.config.ts antes de montar a config
module.exports = createJestConfig(customJestConfig);
