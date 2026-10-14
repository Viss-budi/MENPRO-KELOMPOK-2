import { NAV_ITEMS } from '../../../constants/navigation'
import logo from '../../../assets/images/logo-himafor.webp'
import styles from './Footer.module.css'

// Ikon digambar ulang dari desain UI/UX (Footer.svg), stroke mengikuti warna teks.
const line = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' }

function ContactIcon({ top, children }) {
  return (
    <svg className={styles.contactIcon} viewBox={`788.7 ${top} 16 16`} width="16" height="16" aria-hidden="true">
      {children}
    </svg>
  )
}

const SOCIALS = [
  {
    label: 'Instagram',
    x: 1131,
    icon: (
      <>
        <path d="M1148.5 64H1143.5C1141.57 64 1140 65.567 1140 67.5V72.5C1140 74.433 1141.57 76 1143.5 76H1148.5C1150.43 76 1152 74.433 1152 72.5V67.5C1152 65.567 1150.43 64 1148.5 64Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M1146 72.8C1147.55 72.8 1148.8 71.5464 1148.8 70C1148.8 68.4536 1147.55 67.2 1146 67.2C1144.45 67.2 1143.2 68.4536 1143.2 70C1143.2 71.5464 1144.45 72.8 1146 72.8Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M1149.8 66.8C1150.13 66.8 1150.4 66.5313 1150.4 66.2C1150.4 65.8686 1150.13 65.6 1149.8 65.6C1149.47 65.6 1149.2 65.8686 1149.2 66.2C1149.2 66.5313 1149.47 66.8 1149.8 66.8Z" fill="currentColor" stroke="currentColor" strokeWidth="1.4" />
      </>
    ),
  },
  {
    label: 'YouTube',
    x: 1176,
    icon: (
      <>
        <path d="M1195.5 64.5H1186.5C1184.57 64.5 1183 66.067 1183 68V72C1183 73.933 1184.57 75.5 1186.5 75.5H1195.5C1197.43 75.5 1199 73.933 1199 72V68C1199 66.067 1197.43 64.5 1195.5 64.5Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M1189 67L1194.5 70L1189 73V67Z" fill="currentColor" />
      </>
    ),
  },
  {
    label: 'TikTok',
    x: 1220,
    icon: (
      <path d="M1233 70.5C1232.41 70.5 1231.83 70.6759 1231.33 71.0056C1230.84 71.3352 1230.46 71.8038 1230.23 72.3519C1230 72.9001 1229.94 73.5033 1230.06 74.0853C1230.17 74.6672 1230.46 75.2018 1230.88 75.6213C1231.3 76.0409 1231.83 76.3266 1232.41 76.4424C1233 76.5581 1233.6 76.4987 1234.15 76.2716C1234.7 76.0446 1235.16 75.6601 1235.49 75.1667C1235.82 74.6734 1236 74.0933 1236 73.5V63C1236.5 66 1238.5 67 1241 67" {...line} strokeWidth="1.5" />
    ),
  },
  {
    label: 'X',
    x: 1263,
    icon: <path d="M1272.5 64L1283.5 76M1283.5 64L1272.5 76" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />,
  },
]

const Footer = () => {
  return (
    <footer id="kontak" className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Kolom 1: Profil */}
          <div className={styles.colProfile}>
            <img src={logo} alt="Logo HIMAFOR" className={styles.logo} width="64" height="66" />
            <div className={styles.profileText}>
              <h3 className={styles.brandName}>HIMAFOR</h3>
              <p className={styles.brandSub}>Himpunan Mahasiswa Informatika</p>
              <p className={styles.description}>
                Bersama membangun kolaborasi, berinovasi, dan berkontribusi untuk Informatika yang lebih baik.
              </p>
            </div>
          </div>

          {/* Kolom 2: Tautan Cepat (sama dengan menu Navbar) */}
          <div className={styles.colLinks}>
            <h4 className={styles.heading}>Tautan Cepat</h4>
            <ul className={styles.linkList}>
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom 3: Kontak Kami */}
          <div className={styles.colContact}>
            <h4 className={styles.heading}>Kontak Kami</h4>
            <ul className={styles.contactList}>
              <li>
                <ContactIcon top="59.6">
                  <path d="M802 62H792C790.895 62 790 62.8954 790 64V70C790 71.1046 790.895 72 792 72H802C803.105 72 804 71.1046 804 70V64C804 62.8954 803.105 62 802 62Z" {...line} strokeWidth="1.3" />
                  <path d="M791 64L797 68.5L803 64" {...line} strokeWidth="1.3" />
                </ContactIcon>
                <span>himafor@uinssc.ac.id</span>
              </li>
              <li>
                <ContactIcon top="87.6">
                  <path d="M792.5 90H795L796.5 93.5L794.8 94.8C795.558 96.2552 796.745 97.4421 798.2 98.2L799.5 96.5L803 98V100.5C803 100.898 802.842 101.279 802.561 101.561C802.279 101.842 801.898 102 801.5 102C798.715 102 796.045 100.894 794.075 98.9246C792.106 96.9555 791 94.2848 791 91.5C791 91.1022 791.158 90.7206 791.439 90.4393C791.721 90.158 792.102 90 792.5 90Z" {...line} strokeWidth="1.3" />
                </ContactIcon>
                <span>+62 812 3456 7890</span>
              </li>
              <li>
                <ContactIcon top="116.7">
                  <path d="M797 116C794 116 791.5 118.4 791.5 121.3C791.5 125.2 797 130 797 130C797 130 802.5 125.2 802.5 121.3C802.5 118.4 800 116 797 116Z" fill="none" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M797 123.2C798.105 123.2 799 122.305 799 121.2C799 120.095 798.105 119.2 797 119.2C795.895 119.2 795 120.095 795 121.2C795 122.305 795.895 123.2 797 123.2Z" fill="none" stroke="currentColor" strokeWidth="1.3" />
                </ContactIcon>
                <span>UIN Siber Syekh Nurjati Cirebon</span>
              </li>
            </ul>
          </div>

          {/* Kolom 4: Ikuti Kami */}
          <div className={styles.colSocial}>
            <h4 className={styles.heading}>Ikuti Kami</h4>
            <div className={styles.socialIcons}>
              {SOCIALS.map((s) => (
                <a key={s.label} href="#" className={styles.socialBtn} aria-label={s.label}>
                  <svg viewBox={`${s.x} 55 30 30`} width="30" height="30" aria-hidden="true">
                    {s.icon}
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Bawah */}
        <div className={styles.bottomBar}>
          <p>© 2026 HIMAFOR. All rights reserved.</p>
          <p>Informatics • Collaboration • Innovation</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
