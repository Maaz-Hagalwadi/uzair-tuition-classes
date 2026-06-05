import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import WhyChooseUs from '../components/landing/WhyChooseUs';
import FeaturedCourses from '../components/landing/FeaturedCourses';
import UpcomingBatches from '../components/landing/UpcomingBatches';
import Testimonials from '../components/landing/Testimonials';
import ContactSection from '../components/landing/ContactSection';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <WhyChooseUs />
      <FeaturedCourses />
      <UpcomingBatches />
      <Testimonials />
      <ContactSection />
      <Footer />
    </div>
  );
}
