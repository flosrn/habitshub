export default function HubLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className="absolute -mt-16 w-screen h-[100dvh] z-0 bg-center bg-cover bg-[url(/bg1.jpg)] blur-md filter duration-300 transition-opacity ease-in-out" />
      {children}
    </>
  );
}
