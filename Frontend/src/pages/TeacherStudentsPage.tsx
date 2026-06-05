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
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-bold text-[#1e1b4b]">Students</h1>
            <p className="text-sm text-[#6b7280] mt-0.5">
              {uniqueStudentCount > 0
                ? `${uniqueStudentCount} unique student${uniqueStudentCount !== 1 ? 's' : ''} across ${batches.length} batch${batches.length !== 1 ? 'es' : ''}`
                : 'Students enrolled in your batches'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#9ca3af]">
              <span className="material-symbols-outlined text-[18px]">search</span>
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-9 pr-4 py-2 border border-[#e4e2e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]"
            />
          </div>
          <select
            value={batchFilter === 'ALL' ? 'ALL' : String(batchFilter)}
            onChange={e => setBatchFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="px-3 py-2 border border-[#e4e2e6] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] text-[#374151]"
          >
            <option value="ALL">All Batches</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-[#6b7280]">
            <span className="material-symbols-outlined text-[24px] animate-spin mr-2">sync</span>
            Loading students…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#9ca3af]">
            <span className="material-symbols-outlined text-[48px] mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>person_search</span>
            <p className="text-sm font-medium">
              {search || batchFilter !== 'ALL' ? 'No students match your filters' : 'No students enrolled yet'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#e4e2e6] overflow-hidden">
            <div className="px-5 py-3 bg-[#f9fafb] border-b border-[#f3f4f6]">
              <p className="text-xs text-[#9ca3af]">
                Showing {filtered.length} enrollment{filtered.length !== 1 ? 's' : ''}
                {search && ` for "${search}"`}
              </p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f9fafb] text-[#9ca3af] text-xs uppercase tracking-wide border-b border-[#f3f4f6]">
                  <th className="text-left px-5 py-3 font-medium">Student</th>
                  <th className="text-left px-4 py-3 font-medium">Batch</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Phone</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {filtered.map((row, i) => (
                  <tr key={`${row.studentId}-${row.batchId}-${i}`} className="hover:bg-[#fafafa] transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-[#374151]">{row.firstName} {row.lastName}</p>
                      <p className="text-xs text-[#9ca3af]">{row.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[#374151] text-xs font-medium">{row.batchName}</p>
                      <p className="text-[10px] text-[#9ca3af]">{row.courseName}</p>
                    </td>
                    <td className="px-4 py-3 text-[#6b7280] text-xs hidden sm:table-cell">{row.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-[#9ca3af] hidden md:table-cell">
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
