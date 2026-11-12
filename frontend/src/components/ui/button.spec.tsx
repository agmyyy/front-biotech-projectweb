import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./button";

describe("Button", () => {
  it("renderiza o texto do filho", () => {
    render(<Button>Salvar</Button>);

    expect(
      screen.getByRole("button", { name: "Salvar" }),
    ).toBeInTheDocument();
  });

  it("dispara onClick ao ser clicado", () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Enviar</Button>);

    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("fica desabilitado quando disabled", () => {
    const onClick = jest.fn();
    render(
      <Button disabled onClick={onClick}>
        Enviar
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Enviar" });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("fica desabilitado e mostra o spinner quando isLoading", () => {
    const onClick = jest.fn();
    render(
      <Button isLoading onClick={onClick}>
        Enviar
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Enviar" });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    // O spinner é um svg com aria-hidden
    expect(button.querySelector("svg[aria-hidden='true']")).not.toBeNull();
  });

  it("aplica a classe da variante default por padrão", () => {
    render(<Button>Padrão</Button>);

    const button = screen.getByRole("button", { name: "Padrão" });
    expect(button.className).toContain("bg-green-1");
  });

  it("aplica a classe da variante ghost quando solicitada", () => {
    render(<Button variant="ghost">Fantasma</Button>);

    const button = screen.getByRole("button", { name: "Fantasma" });
    expect(button.className).toContain("text-green-1");
    expect(button.className).not.toContain("bg-green-1");
  });

  it("aplica o tamanho sm quando solicitado", () => {
    render(<Button size="sm">Pequeno</Button>);

    const button = screen.getByRole("button", { name: "Pequeno" });
    expect(button.className).toContain("h-8");
  });

  it("encaminha atributos HTML adicionais", () => {
    render(
      <Button type="submit" aria-label="botão especial">
        OK
      </Button>,
    );

    const button = screen.getByRole("button", { name: "botão especial" });
    expect(button).toHaveAttribute("type", "submit");
  });
});
