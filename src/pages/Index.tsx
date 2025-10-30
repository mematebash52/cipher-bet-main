import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ActiveMarkets from "@/components/ActiveMarkets";
import FeaturesSection from "@/components/FeaturesSection";
import AdminControls from "@/components/AdminControls";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-20">
        <section id="about">
          <Hero />
        </section>
        <section id="markets">
          <ActiveMarkets />
        </section>
        <AdminControls />
        <section id="how-it-works">
          <FeaturesSection />
        </section>
      </main>
    </div>
  );
};

export default Index;
