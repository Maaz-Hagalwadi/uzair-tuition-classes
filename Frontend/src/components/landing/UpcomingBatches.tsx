import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

interface Batch {
  id: number;
  name: string;
  courseName: string;
  teacherName: string | null;
  startDate: string;
  timings: string | null;
  maxStudents: number;
  studentCount: number;
  status: string;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function seatsInfo(max: number, enrolled: number) {
  const left = max - enrolled;
  if (left <= 0) return { label: 'Full', style: 'bg-[#f3f4f6] text-[#6b7280]' };
  if (left <= 5) return { label: `Only ${left} Left`, style: 'bg-[#ffdad6] text-[#93000a]' };
  return { label: `${left} Left`, style: 'bg-[rgba(30,27,75,0.1)] text-[#1e1b4b]' };
}

export default function UpcomingBatches() {
  const { data: batches = [], isLoading } = useQuery<Batch[]>({
    queryKey: ['public-batches'],
    queryFn: async () => (await api.get('/public/batches')).data,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <section className="py-12 px-6 sm:px-12 max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-headline text-[#0f172a] text-2xl font-bold mb-2">
          Upcoming Batches
        </h2>
        <p className="text-sm text-[#464555]">Reserve your seat before it fills up.</p>
      </div>

      {isLoading ? (
        <div className="bg-white border border-[#c7c4d8] rounded-2xl overflow-hidden shadow-sm">
          {[1, 2, 3].map(i => (
            <div key={i} className="px-5 py-4 border-b border-[#c7c4d8] last:border-0 animate-pulse flex gap-4">
              <div className="h-4 bg-[#e5eeff] rounded w-1/4" />
              <div className="h-4 bg-[#f1f5f9] rounded w-1/6" />
              <div className="h-4 bg-[#f1f5f9] rounded w-1/5" />
            </div>
          ))}
        </div>
      ) : batches.length === 0 ? (
        <p className="text-sm text-[#94a3b8] text-center py-8">No upcoming batches at the moment. Check back soon!</p>
      ) : (
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
                {batches.map(b => {
                  const { label, style } = seatsInfo(b.maxStudents, b.studentCount);
                  return (
                    <tr key={b.id} className="hover:bg-[#f8f9ff] transition-colors">
                      <td className="px-5 py-4 text-sm font-bold">{b.name}</td>
                      <td className="px-5 py-4 text-sm">{fmtDate(b.startDate)}</td>
                      <td className="px-5 py-4 text-sm text-[#1e1b4b] font-semibold">{b.teacherName ?? '—'}</td>
                      <td className="px-5 py-4 text-sm">{b.timings ?? '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${style}`}>{label}</span>
                      </td>
                      <td className="px-5 py-4">
                        <a href="#contact" className="text-[#1e1b4b] font-bold text-sm hover:underline">
                          Enroll Now
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-[#c7c4d8]">
            {batches.map(b => {
              const { label, style } = seatsInfo(b.maxStudents, b.studentCount);
              return (
                <div key={b.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-bold">{b.name}</p>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${style}`}>{label}</span>
                  </div>
                  <p className="text-xs text-[#464555]">{fmtDate(b.startDate)}{b.teacherName ? ` · ${b.teacherName}` : ''}</p>
                  {b.timings && <p className="text-xs text-[#464555] mt-0.5">{b.timings}</p>}
                  <a href="#contact" className="inline-block mt-3 text-xs font-bold text-[#1e1b4b] hover:underline">
                    Enroll Now →
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
