import { Footer } from '@/components/navigations/Footer';
import { PageTransition } from '@/components/motion/PageTransition';
import { Navbar } from '@/components/navigations/Navbar';
import { ScrollToTop } from '@/components/navigations/ScrollToTop';
import WhatsAppWidget from '@/components/WhatsAppWidget';

export const MainLayout = () => {
  return (
    <>
      <WhatsAppWidget />

      <div className="min-h-screen flex flex-col">
        <ScrollToTop />

        <header className="sticky top-0 z-50 w-full">
          <Navbar />
        </header>

        <main id="main-content" className="flex-1">
          <div className="w-full 2xl:w-[80%] 2xl:px-0 2xl:mx-auto">
            <PageTransition />
          </div>
        </main>

        <div className="mt-auto w-full">
          <Footer />
        </div>
      </div>
    </>
  );
};
