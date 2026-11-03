import { Hero } from "../components/home/Hero";
import { Featured } from "../components/home/Featured";
import { Showroom } from "../components/showroom/Showroom";
import { CtaBand } from "../components/home/CtaBand";

export function HomePage() {
  return (
    <>
      <Hero />
      <Featured />
      <Showroom />
      <CtaBand />
    </>
  );
}
