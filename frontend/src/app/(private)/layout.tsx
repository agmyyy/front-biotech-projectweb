export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="painel-wrapper">{children}</div>;
}
