import { render, screen, fireEvent } from "@testing-library/react";
import { SearchInput } from "./search-input";

const shortText = "Curto o bastante para caber";
const longText = "a".repeat(250);

describe("SearchInput", () => {
  it("exibe o texto completo quando é curto", () => {
    render(<SearchInput text={shortText} maxLength={200} />);

    expect(screen.getByText(shortText)).toBeInTheDocument();
    // Sem botão de expansão
    expect(
      screen.queryByRole("button", { name: "Mostrar mais" }),
    ).not.toBeInTheDocument();
  });

  it("trunca textos longos com reticências", () => {
    render(<SearchInput text={longText} maxLength={100} />);

    expect(screen.getByText(`${"a".repeat(100)}...`)).toBeInTheDocument();
    expect(screen.queryByText(longText)).not.toBeInTheDocument();
  });

  it("renderiza o botão Mostrar mais para textos longos", () => {
    render(<SearchInput text={longText} maxLength={100} />);

    const toggle = screen.getByRole("button", { name: "Mostrar mais" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("expande o texto completo ao clicar em Mostrar mais", () => {
    render(<SearchInput text={longText} maxLength={100} />);

    fireEvent.click(screen.getByRole("button", { name: "Mostrar mais" }));

    expect(screen.getByText(longText)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mostrar menos" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.queryByRole("button", { name: "Mostrar mais" }),
    ).not.toBeInTheDocument();
  });

  it("recolta o texto ao clicar em Mostrar menos", () => {
    render(<SearchInput text={longText} maxLength={100} />);

    fireEvent.click(screen.getByRole("button", { name: "Mostrar mais" }));
    fireEvent.click(screen.getByRole("button", { name: "Mostrar menos" }));

    expect(screen.getByText(`${"a".repeat(100)}...`)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mostrar mais" }),
    ).toBeInTheDocument();
  });

  it("usa 200 caracteres de limite por padrão", () => {
    const text = "b".repeat(250);
    render(<SearchInput text={text} />);

    expect(screen.getByText(`${"b".repeat(200)}...`)).toBeInTheDocument();
  });

  it("não trunca quando o texto tem exatamente o limite", () => {
    const text = "c".repeat(100);
    render(<SearchInput text={text} maxLength={100} />);

    expect(screen.getByText(text)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Mostrar mais" }),
    ).not.toBeInTheDocument();
  });
});
