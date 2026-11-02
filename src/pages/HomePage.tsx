import { Hero } from "../components/home/Hero";
import { Marquee } from "../components/home/Marquee";
import { Experiences } from "../components/home/Experiences";
import { Steps } from "../components/home/Steps";
import { Featured } from "../components/home/Featured";
import { CtaBand } from "../components/home/CtaBand";

export function HomePage() {
  return (
    <>
      <Hero />
      <Marquee />
      <Experiences />
      <Steps />
      <Featured />
      <CtaBand />
    </>
  );
}
