import { render, screen, fireEvent } from "@testing-library/react";
import { FeedbackRating } from "./feedback-rating";

describe("FeedbackRating", () => {
  it("renderiza o grupo com aria-label de acessibilidade", () => {
    render(<FeedbackRating onSelect={jest.fn()} />);

    expect(
      screen.getByRole("group", { name: "Avaliação da pesquisa" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Avalie sua pesquisa:")).toBeInTheDocument();
  });

  it("renderiza 5 estrelas rotuladas de 1 a 5", () => {
    render(<FeedbackRating onSelect={jest.fn()} />);

    expect(screen.getByRole("button", { name: "1 estrela" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2 estrelas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3 estrelas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "4 estrelas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "5 estrelas" })).toBeInTheDocument();
  });

  it("notifica a nota escolhida no clique", () => {
    const onSelect = jest.fn();
    render(<FeedbackRating onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: "4 estrelas" }));

    expect(onSelect).toHaveBeenCalledWith(4);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("marca a estrela escolhida com aria-pressed", () => {
    render(<FeedbackRating onSelect={jest.fn()} />);

    const fourth = screen.getByRole("button", { name: "4 estrelas" });
    expect(fourth).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(fourth);

    expect(fourth).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "3 estrelas" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("respeita o maxRating customizado", () => {
    render(<FeedbackRating onSelect={jest.fn()} maxRating={3} />);

    expect(screen.getByRole("button", { name: "3 estrelas" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "4 estrelas" }),
    ).not.toBeInTheDocument();
  });

  it("ignora cliques quando disabled", () => {
    const onSelect = jest.fn();
    render(<FeedbackRating onSelect={onSelect} disabled />);

    const fifth = screen.getByRole("button", { name: "5 estrelas" });
    expect(fifth).toBeDisabled();

    fireEvent.click(fifth);

    expect(onSelect).not.toHaveBeenCalled();
    expect(fifth).toHaveAttribute("aria-pressed", "false");
  });
});
