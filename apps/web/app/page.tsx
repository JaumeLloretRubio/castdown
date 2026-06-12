import { Header } from "../components/Header";
import { Hero } from "../components/Hero";
import { ToMd } from "../components/ToMd";
import { FromMd } from "../components/FromMd";
import { Crawler } from "../components/Crawler";
import { ApiMcp } from "../components/ApiMcp";
import { Packages } from "../components/Packages";
import { LiveLog } from "../components/LiveLog";
import { Features } from "../components/Features";
import { Footer } from "../components/Footer";
import { StatusBar } from "../components/StatusBar";

export default function HomePage() {
  return (
    <>
      <Header />
      <Hero />
      <section className="grid grid-cols-2">
        <ToMd />
        <FromMd />
      </section>
      <Crawler />
      <ApiMcp />
      <Packages />
      <LiveLog />
      <Features />
      <Footer />
      <StatusBar />
    </>
  );
}
