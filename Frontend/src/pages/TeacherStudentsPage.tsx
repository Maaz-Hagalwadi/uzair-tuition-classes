import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import { TEACHER_NAV } from '../lib/teacherNav';
import api from '../lib/api';

interface Batch {
  id: number;
  name: string;
  courseName: string;
  status: string;
}

interface Student {
  studentId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  enrolledAt: string;
}

interface StudentRow extends Student {
  batchId: number;
  batchName: string;
  courseName: string;
}

const GRADIENTS = [
  'from-[#6366f1] to-[#8b5cf6]',
  'from-[#0ea5e9] to-[#6366f1]',
  'from-[#f59e0b] to-[#ef4444]',
  'from-[#10b981] to-[#0ea5e9]',
  'from-[#ec4899] to-[#f59e0b]',
];

export default function TeacherStudentsPage() {
  const [search, setSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState<number | 'ALL'>('ALL');

  const { data: batches = [], isLoading: batchesLoading } = useQuery<Batch[]>({
    queryKey: ['teacher-batches'],
    queryFn: async () => { const { data } = await api.get('/teacher/batches'); return data; },
  });

  // Fetch students for every batch in parallel once batches are loaded
  const { data: allRows = [], isLoading: studentsLoading } = useQuery<StudentRow[]>({
    queryKey: ['teacher-all-students', batches.map(b => b.id).join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        batches.map(async b => {
          const { data } = await api.get<Student[]>(`/teacher/batches/${b.id}/students`);
          return data.map(s => ({
            ...s,
            batchId: b.id,
            batchName: b.name,
            courseName: b.courseName,
          }));
        })
      );
      return results.flat();
    },
    enabled: batches.length > 0,
  });

  const isLoading = batchesLoading || studentsLoading;

  const filtered = useMemo(() => {
    let rows = allRows;
    if (batchFilter !== 'ALL') rows = rows.filter(r => r.batchId === batchFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        r.firstName.toLowerCase().includes(q) ||
        r.lastName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [allRows, batchFilter, search]);

  // Unique students across all batches for the total count
  const uniqueStudentCount = useMemo(() =>
    new Set(allRows.map(r => r.studentId)).size,
    [allRows]
  );

  return (
    <DashboardShell navItems={TEACHER_NAV}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-5">
          <h1 className="font-['Source_Serif_4'] text-[20px] sm:text-[28px] font-semibold text-[#0f172a] leading-tight">Students</h1>
          <p className="text-[11px] sm:text-[13px] text-[#64748b] mt-0.5">
            {uniqueStudentCount > 0
              ? `${uniqueStudentCount} unique student${uniqueStudentCount !== 1 ? 's' : ''} across ${batches.length} batch${batches.length !== 1 ? 'es' : ''}`
              : 'Students enrolled in your batches'}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#9ca3af]">
              <span className="material-symbols-outlined text-[17px]">search</span>
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-9 pr-4 py-2 border border-[#e2e8f0] rounded-xl text-[12px] sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]"
            />
          </div>
          <select
            value={batchFilter === 'ALL' ? 'ALL' : String(batchFilter)}
            onChange={e => setBatchFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="px-3 py-2 border border-[#e2e8f0] rounded-xl text-[12px] sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] text-[#374151]"
          >
            <option value="ALL">All Batches</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#94a3b8]">
            <span className="material-symbols-outlined text-[24px] animate-spin mb-2">sync</span>
            <p className="text-[13px]">Loading students…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#94a3b8]">
            <span className="material-symbols-outlined text-[36px] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>person_search</span>
            <p className="text-[13px]">
              {search || batchFilter !== 'ALL' ? 'No students match your filters' : 'No students enrolled yet'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
            <div className="px-4 sm:px-5 py-3 bg-[#f8f9fa] border-b border-[#e2e8f0]">
              <p className="text-[11px] text-[#9ca3af]">
                Showing {filtered.length} enrollment{filtered.length !== 1 ? 's' : ''}
                {search && ` for "${search}"`}
              </p>
            </div>

            {/* Mobile list */}
            <div className="sm:hidden divide-y divide-[#f1f5f9]">
              {filtered.map((row, i) => {
                const grad = GRADIENTS[i % GRADIENTS.length];
                const initials = `${row.firstName[0]}${row.lastName[0]}`.toUpperCase();
                return (
                  <div key={`${row.studentId}-${row.batchId}-${i}`} className="flex items-center gap-3 px-4 py-3.5">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shrink-0`}>
                      <span className="text-white text-[11px] font-bold">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#0f172a] truncate">{row.firstName} {row.lastName}</p>
                      <p className="text-[11px] text-[#64748b] truncate">{row.email}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[10px] text-[#6366f1] bg-[#eef2ff] px-2 py-0.5 rounded-full font-medium truncate max-w-[140px]">
                          <span className="material-symbols-outlined text-[10px]">groups</span>
                          {row.batchName}
                        </span>
                        {row.phone && (
                          <span className="text-[10px] text-[#94a3b8]">{row.phone}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <table className="hidden sm:table w-full text-sm">
              <thead>
                <tr className="bg-[#f8f9fa] text-[#9ca3af] text-[11px] uppercase tracking-wide border-b border-[#e2e8f0]">
                  <th className="text-left px-5 py-3 font-semibold">Student</th>
                  <th className="text-left px-4 py-3 font-semibold">Batch</th>
                  <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Phone</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {filtered.map((row, i) => (
                  <tr key={`${row.studentId}-${row.batchId}-${i}`} className="hover:bg-[#fafbff] transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-[13px] font-semibold text-[#0f172a]">{row.firstName} {row.lastName}</p>
                      <p className="text-[11px] text-[#94a3b8]">{row.email}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-[12px] text-[#374151] font-medium">{row.batchName}</p>
                      <p className="text-[11px] text-[#94a3b8]">{row.courseName}</p>
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-[#6b7280] hidden sm:table-cell">{row.phone ?? '—'}</td>
                    <td className="px-4 py-3.5 text-[12px] text-[#94a3b8] hidden md:table-cell">
                      {new Date(row.enrolledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
