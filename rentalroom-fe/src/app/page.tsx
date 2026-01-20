import HeroSection from '@/components/landing/hero-section';
import ShowcaseSection from '@/components/landing/showcase-section';
import FeaturesSection from '@/components/landing/features-section';
import MapSection from '@/components/landing/map-section';
import TestimonialsSection from '@/components/landing/testimonials-section';
import CTASection from '@/components/landing/cta-section';
import Footer from '@/components/landing/footer';
import { Header } from '@/components/layout/header/header';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-br from-page-gradient-from to-page-gradient-to">
        <HeroSection />
        <ShowcaseSection />
        <FeaturesSection />
        <MapSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
