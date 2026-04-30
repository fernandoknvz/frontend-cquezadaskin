import Services from '@/features/services/components/Services'
import { Hero } from '@/features/home/components/Hero'


export const HomePage = () => {
  return (
    <>
    <div className=''>
    <Hero/>
    <div className='lg:w-[90%] 2xl:w-[80%] mx-auto'>
    <Services/>
    </div>
    
    </div>
    
    </>
  )
}
