import { Container } from "@/components/ui/Layout";
import { HeaderNav } from "./HeaderNav";
import { Logo } from "./Logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <Container className="relative flex h-16 items-center justify-between gap-4 sm:h-[4.5rem]">
        <Logo />
        <HeaderNav />
      </Container>
    </header>
  );
}
