export default function Hero() {
  return (
    <section id="home" className="relative overflow-hidden flex items-center bg-[#f8f9ff] min-h-[580px]">
      {/* Background blob */}
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
        <div className="w-full h-full bg-[#1e1b4b] rounded-bl-full transform translate-x-1/4 -translate-y-1/4"></div>
      </div>

      <div className="container mx-auto px-12 grid md:grid-cols-2 gap-8 items-center relative z-10 py-16">
        {/* Left */}
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[rgba(30,27,75,0.1)] text-[#1e1b4b] rounded-full">
            <span className="material-symbols-outlined text-[16px]">school</span>
            <span className="text-xs font-medium">Expert Tuition Classes · Grade 7–12</span>
          </div>

          <h1 className="font-headline text-[#0f172a] leading-tight text-4xl lg:text-5xl font-bold tracking-tight">
            Learn. Practice.{' '}
            <span className="text-[#1e1b4b] italic">Succeed.</span>
          </h1>

          <p className="text-base text-[#464555] max-w-md leading-relaxed">
            Master Maths, Physics, and Chemistry with expert tutors. Small batches,
            personalised attention, and consistent results since 2022.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="#courses"
              className="px-6 py-3 bg-[#1e1b4b] text-white rounded-xl text-sm font-semibold shadow-lg hover:scale-105 transition-transform"
            >
              Explore Courses
            </a>
            <a
              href="#contact"
              className="px-6 py-3 border-2 border-[#1e1b4b] text-[#1e1b4b] rounded-xl text-sm font-semibold hover:bg-[rgba(30,27,75,0.05)] transition-colors"
            >
              Request Callback
            </a>
          </div>
        </div>

        {/* Right — image */}
        <div className="hidden md:flex justify-center">
          <div className="relative">
            <div className="w-80 h-72 rounded-3xl overflow-hidden shadow-2xl rotate-2">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNwi2s5n271sHKXJNk98H5AZwnfzci500IV_Q_IwiHyNjr3aMqA1mQfyzSnxlxxBk_fvmvOa-wlDpq3_sVrZT_p8lVZX9-tThsIgUOk8_w1GihGBw5tUNQVh-lGsJUfzNdbu6uyaMl4r2_aCOVMq1SWiF2vE0U2hnIw3fZ53d6PeMHEcu1-5whpqBzUEXIRE6f96_YueoxzTTQmJ9qpdh0WUjKFj_NOXKlBRH1yXnxoOZC-I9aL0FFm_V7cEr7nPVLvefB8b1ViGZZ"
                alt="Student studying"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Floating stat */}
            <div className="absolute -bottom-5 -left-6 glass-effect px-4 py-3 rounded-xl shadow-lg border border-[#c7c4d8] flex items-center gap-3">
              <div className="w-9 h-9 bg-[rgba(30,27,75,0.1)] rounded-full flex items-center justify-center text-[#1e1b4b]">
                <span className="material-symbols-outlined text-[18px]">trending_up</span>
              </div>
              <div>
                <div className="font-headline font-bold text-xs">100% Pass Rate</div>
                <div className="text-[#464555] text-[11px]">Consistent results</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
