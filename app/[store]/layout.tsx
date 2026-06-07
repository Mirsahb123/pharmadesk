export default function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { store: string };
}) {
  return (
    <>
      {children}
    </>
  );
}
