import Services from '@/features/services/components/Services'
import { Hero } from '@/features/home/components/Hero'
import { FAQSection } from '@/components/FAQSection'
import { TestimoniosSection } from '@/components/TestimoniosSection'


export const HomePage = () => {
  return (
    <>
    <div className=''>
    <Hero/>
    <div className='lg:w-[90%] 2xl:w-[80%] mx-auto'>
    <Services/>
    </div>
    <TestimoniosSection/>
    <FAQSection/>
    
    </div>
    
    </>
  )
}
