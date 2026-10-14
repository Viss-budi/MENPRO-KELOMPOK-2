import Navbar from '../../../components/layout/Navbar/Navbar'
import HeroSection from './components/HeroSection/HeroSection'
import KegiatanTerbaru from './components/KegiatanTerbaru/KegiatanTerbaru'
import InformasiBerita from './components/InformasiBerita/InformasiBerita'
import Footer from '../../../components/layout/Footer/Footer'

function Home() {
  return (
    <>
      <Navbar />
      <main id="beranda">
        <HeroSection />
        <KegiatanTerbaru />
        <InformasiBerita />
      </main>
      <Footer />
    </>
  )
}

export default Home
