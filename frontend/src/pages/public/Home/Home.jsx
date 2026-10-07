import HeroSection from './components/HeroSection/HeroSection'
// Tambahkan baris import ini
import KegiatanTerbaru from './components/KegiatanTerbaru/KegiatanTerbaru' 
import InformasiBerita from './components/InformasiBerita/InformasiBerita'
import Footer from '../../../components/Footer/Footer'

function Home() {
  return (
    <main>
      <HeroSection />
      {/* Tambahkan komponennya di bawah HeroSection */}
      <KegiatanTerbaru />
      <InformasiBerita />
      <Footer />
    </main>
  )
}

export default Home