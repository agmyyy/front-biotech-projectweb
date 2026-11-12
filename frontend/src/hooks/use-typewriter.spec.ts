import { renderHook, act } from "@testing-library/react";
import { useTypewriter } from "./use-typewriter";

describe("useTypewriter", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("retorna o texto completo sem animação quando desabilitado", () => {
    const { result } = renderHook(() =>
      useTypewriter({ text: "Texto completo", enabled: false }),
    );

    expect(result.current.displayedText).toBe("Texto completo");
    expect(result.current.isTyping).toBe(false);
    // Nenhum timer agendado para animar
    expect(jest.getTimerCount()).toBe(0);
  });

  it("retorna o texto completo quando não está animando", () => {
    const { result } = renderHook(() => useTypewriter({ text: "" }));

    expect(result.current.displayedText).toBe("");
    expect(result.current.isTyping).toBe(false);
  });

  it("anima o texto caractere a caractere até completar", () => {
    const onComplete = jest.fn();
    const { result } = renderHook(() =>
      useTypewriter({ text: "Olá", onComplete }),
    );

    // Inicialmente vazio e marcando como digitando
    expect(result.current.displayedText).toBe("");
    expect(result.current.isTyping).toBe(true);

    // Avança todos os timers encadeados da animação
    act(() => {
      jest.runAllTimers();
    });

    expect(result.current.displayedText).toBe("Olá");
    expect(result.current.isTyping).toBe(false);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("respeita a velocidade base de 33ms por caractere", () => {
    const { result } = renderHook(() => useTypewriter({ text: "abcd" }));

    act(() => {
      jest.advanceTimersByTime(0);
    });
    // Primeiro caractere aparece no passo inicial
    expect(result.current.displayedText).toBe("a");

    act(() => {
      jest.advanceTimersByTime(33);
    });
    expect(result.current.displayedText).toBe("ab");

    act(() => {
      jest.advanceTimersByTime(33);
    });
    expect(result.current.displayedText).toBe("abc");
  });

  it("pausa mais tempo após pontuação (165ms)", () => {
    // O delay é a pausa DEPOIS de exibir o caractere: "a.b" mostra o ponto
    // aos 33ms e só ganha o "b" após 165ms de espera
    const { result } = renderHook(() => useTypewriter({ text: "a.b" }));

    act(() => {
      jest.advanceTimersByTime(0);
    });
    expect(result.current.displayedText).toBe("a");

    act(() => {
      jest.advanceTimersByTime(33);
    });
    expect(result.current.displayedText).toBe("a.");

    // 132ms dos 165ms da pação de pontuação: ainda sem o "b"
    act(() => {
      jest.advanceTimersByTime(132);
    });
    expect(result.current.displayedText).toBe("a.");

    act(() => {
      jest.advanceTimersByTime(33);
    });
    expect(result.current.displayedText).toBe("a.b");
  });

  it("chama onComplete apenas ao final da animação", () => {
    const onComplete = jest.fn();
    renderHook(() => useTypewriter({ text: "abc", onComplete }));

    // 50ms: "ab" na tela, falta o "c" (a animação inteira leva 99ms)
    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      jest.runAllTimers();
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("reinicia a animação quando o texto muda por completo", () => {
    const { result, rerender } = renderHook(
      ({ text }: { text: string }) => useTypewriter({ text }),
      { initialProps: { text: "abc" } },
    );

    act(() => {
      jest.runAllTimers();
    });
    expect(result.current.displayedText).toBe("abc");

    // Texto diferente do que está na tela: anima do zero, caractere a caractere
    rerender({ text: "xyz" });

    act(() => {
      jest.advanceTimersByTime(0);
    });
    expect(result.current.displayedText).toBe("x");

    act(() => {
      jest.runAllTimers();
    });
    expect(result.current.displayedText).toBe("xyz");
  });

  it("retorna o texto completo quando desabilitado no meio da animação", () => {
    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useTypewriter({ text: "abcdef", enabled }),
      { initialProps: { enabled: true } },
    );

    act(() => {
      jest.runAllTimers();
    });
    expect(result.current.displayedText).toBe("abcdef");

    rerender({ enabled: false });
    expect(result.current.displayedText).toBe("abcdef");
    expect(result.current.isTyping).toBe(false);
  });
});
