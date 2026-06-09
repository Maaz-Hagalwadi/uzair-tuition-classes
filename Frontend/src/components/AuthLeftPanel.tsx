import { Link } from 'react-router-dom';
import Logo from './Logo';

const BG_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBH9YHcsvsSOmIXH5mQlPBVOs9BQ92tH2e9lY87JAaVpZUM6Gz1qNZaNj_vqhzxYFXfZJID7fK1Vsp8qPfQQzq3fCB1qJA7nvL_xm_q0ivqUWPfaf0k_97xNbp7Raaa7elPK5o_yWS1um_MW7bRSa0oTpm2ZyBEMrvU9Grisvxe1c3vLt28L_F9qWzPUVj6W4WuaCEwp1kVOyTHNSdtRWNpmhuQ9WCDJPIsVgjby2QNa4xcbN9g_Im1ZXyLlxI8jg0l4UMWAkJBn6cJ';

export default function AuthLeftPanel() {
  return (
    <section className="hidden lg:flex lg:w-1/2 relative bg-[#1e1b4b] overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src={BG_IMAGE}
          alt=""
          className="w-full h-full object-cover grayscale opacity-40"
          style={{ transform: 'scale(1.05)' }}
        />
      </div>

      <div
        className="absolute inset-0 z-10 flex flex-col justify-center px-16 text-white"
        style={{
          background:
            'linear-gradient(135deg, rgba(7,2,53,0.9) 0%, rgba(30,27,75,0.7) 100%)',
        }}
      >
        <div className="max-w-md">
          <div className="mb-8"><Link to="/"><Logo size={44} textColor="white" /></Link></div>

          <h1 className="font-serif text-[32px] leading-[40px] font-semibold mb-4">
            Empowering Excellence through Expert Guidance
          </h1>

          <p className="text-base leading-7 opacity-80 mb-12">
            Join our community of elite educators and high-achieving students. Access tailored
            resources, live schedules, and a world-class learning management system.
          </p>

          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <span
                className="material-symbols-outlined shrink-0"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
              <div>
                <h3 className="font-semibold text-[18px] leading-6">Verified Curriculum</h3>
                <p className="text-sm leading-5 opacity-70 mt-0.5">
                  Scholarly content vetted by industry experts.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span
                className="material-symbols-outlined shrink-0"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                bolt
              </span>
              <div>
                <h3 className="font-semibold text-[18px] leading-6">Adaptive Learning</h3>
                <p className="text-sm leading-5 opacity-70 mt-0.5">
                  Personalized pathways for every student's success.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 p-12 z-20">
        <p className="font-mono text-xs tracking-widest text-[#8683ba] opacity-50 uppercase">
          © 2025 UZAIR TUITION CLASSES
        </p>
      </div>
    </section>
  );
}
