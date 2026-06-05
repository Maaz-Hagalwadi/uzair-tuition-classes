const batches = [
  {
    name: 'Maths — Grade 10',
    startDate: 'Jun 15, 2025',
    teacher: 'Mr. Uzair',
    timings: 'Mon, Wed, Fri · 8:00–9:30 AM',
    seatsLabel: 'Only 4 Left',
    seatsStyle: 'bg-[#ffdad6] text-[#93000a]',
  },
  {
    name: 'Physics — Grade 11',
    startDate: 'Jun 18, 2025',
    teacher: 'Ms. Sana',
    timings: 'Tue, Thu, Sat · 5:00–6:30 PM',
    seatsLabel: '8 Left',
    seatsStyle: 'bg-[rgba(30,27,75,0.1)] text-[#1e1b4b]',
  },
  {
    name: 'Chemistry — Grade 12',
    startDate: 'Jun 20, 2025',
    teacher: 'Mr. Farhan',
    timings: 'Mon, Wed, Fri · 6:00–7:30 PM',
    seatsLabel: '12 Left',
    seatsStyle: 'bg-[rgba(30,27,75,0.1)] text-[#1e1b4b]',
  },
];

export default function UpcomingBatches() {
  return (
    <section className="py-12 px-12 max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-headline text-[#0f172a] text-2xl font-bold mb-2">
          Upcoming Batches
        </h2>
        <p className="text-sm text-[#464555]">Reserve your seat before it fills up.</p>
      </div>

      <div className="bg-white border border-[#c7c4d8] rounded-2xl overflow-hidden shadow-sm">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#e5eeff] text-[#464555] border-b border-[#c7c4d8]">
                {['Batch', 'Start Date', 'Teacher', 'Schedule', 'Seats', 'Action'].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c7c4d8]">
              {batches.map(b => (
                <tr key={b.name} className="hover:bg-[#f8f9ff] transition-colors">
                  <td className="px-5 py-4 text-sm font-bold">{b.name}</td>
                  <td className="px-5 py-4 text-sm">{b.startDate}</td>
                  <td className="px-5 py-4 text-sm text-[#1e1b4b] font-semibold">{b.teacher}</td>
                  <td className="px-5 py-4 text-sm">{b.timings}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${b.seatsStyle}`}>
                      {b.seatsLabel}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <a href="#contact" className="text-[#1e1b4b] font-bold text-sm hover:underline">
                      Enroll Now
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-[#c7c4d8]">
          {batches.map(b => (
            <div key={b.name} className="p-4">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-bold">{b.name}</p>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${b.seatsStyle}`}>
                  {b.seatsLabel}
                </span>
              </div>
              <p className="text-xs text-[#464555]">{b.startDate} · {b.teacher}</p>
              <p className="text-xs text-[#464555] mt-0.5">{b.timings}</p>
              <a href="#contact" className="inline-block mt-3 text-xs font-bold text-[#1e1b4b] hover:underline">
                Enroll Now →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
