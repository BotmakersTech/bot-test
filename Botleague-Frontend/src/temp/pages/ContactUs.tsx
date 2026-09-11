import Hero from "./contact/Hero";
import ContactSection from "./contact/ContactSection";
import OfficeSection from "./contact/OfficeSection";
import PublicNavbar from "../../shared/components/PublicNavbar";

export default function ContactUs() {
  return (
    <>
    <PublicNavbar/>
      <Hero />
      <ContactSection />
      <OfficeSection />
    </>
  );
}
