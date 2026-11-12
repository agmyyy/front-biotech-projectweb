import { cn, formatDate, truncateText, debounce } from "./utils";

describe("cn", () => {
  it("une classes condicionais", () => {
    expect(cn("p-4", "text-sm")).toBe("p-4 text-sm");
  });

  it("ignora valores falsy", () => {
    expect(cn("p-4", false, undefined, null)).toBe("p-4");
  });

  it("resolve conflitos de classes do Tailwind mantendo a última", () => {
    // twMerge descarta p-2 em favor de p-4 (mesmo grupo de utilitários)
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("retorna string vazia sem entradas", () => {
    expect(cn()).toBe("");
  });
});

describe("formatDate", () => {
  // A vírgula entre data e hora depende dos dados de ICU do Node:
  // o regex aceita com e para o teste ser portátil entre ambientes
  it("formata Date no padrão brasileiro com horário", () => {
    const date = new Date(2026, 5, 19, 15, 30);
    expect(formatDate(date)).toMatch(/^\d{2}\/\d{2}\/\d{4},? 15:30$/);
  });

  it("aceita string ISO", () => {
    const formatted = formatDate("2026-01-05T08:05:00");
    expect(formatted).toMatch(/^\d{2}\/\d{2}\/\d{4},? \d{2}:\d{2}$/);
  });

  it("preenche com zero à esquerda", () => {
    const date = new Date(2026, 0, 3, 7, 5);
    expect(formatDate(date)).toMatch(/^03\/01\/2026,? 07:05$/);
  });
});

describe("truncateText", () => {
  it("retorna o texto original quando cabe no limite", () => {
    expect(truncateText("curto", 10)).toBe("curto");
  });

  it("retorna o texto original quando tem exatamente o limite", () => {
    expect(truncateText("12345", 5)).toBe("12345");
  });

  it("corta e adiciona reticências quando excede o limite", () => {
    expect(truncateText("1234567890", 5)).toBe("12345...");
  });

  it("funciona com limite 0", () => {
    expect(truncateText("abc", 0)).toBe("...");
  });
});

describe("debounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("atrasa a execução até o fim da espera", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced();

    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("só executa a última chamada quando dispara várias vezes", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced("primeira");
    jest.advanceTimersByTime(50);
    debounced("segunda");
    jest.advanceTimersByTime(50);
    // Ainda dentro da nova janela: a primeira foi cancelada
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(50);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("segunda");
  });

  it("pode ser chamado novamente após disparar", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced("a");
    jest.advanceTimersByTime(100);
    debounced("b");
    jest.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(1, "a");
    expect(fn).toHaveBeenNthCalledWith(2, "b");
  });

  it("propaga múltiplos argumentos", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced("x", 42, true);
    jest.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith("x", 42, true);
  });
});
