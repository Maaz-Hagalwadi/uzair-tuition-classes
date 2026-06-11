import { BrowserRouter, Route, Routes } from 'react-router-dom';
import GuestRoute from './components/GuestRoute';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import StudentDashboard from './pages/StudentDashboard';
import StudentCoursesPage from './pages/StudentCoursesPage';
import StudentExplorePage from './pages/StudentExplorePage';
import StudentSchedulePage from './pages/StudentSchedulePage';
import StudentQuizzesPage from './pages/StudentQuizzesPage';
import StudentQuizPage from './pages/StudentQuizPage';
import StudentAttendancePage from './pages/StudentAttendancePage';
import StudentAnnouncementsPage from './pages/StudentAnnouncementsPage';
import StudentPaymentsPage from './pages/StudentPaymentsPage';
import StudentAIPage from './pages/StudentAIPage';
import StudentProgressPage from './pages/StudentProgressPage';
import StudentAssignmentsPage from './pages/StudentAssignmentsPage';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherBatchesPage from './pages/TeacherBatchesPage';
import TeacherBatchDetailPage from './pages/TeacherBatchDetailPage';
import TeacherStudentsPage from './pages/TeacherStudentsPage';
import TeacherMaterialsPage from './pages/TeacherMaterialsPage';
import TeacherQuizzesPage from './pages/TeacherQuizzesPage';
import TeacherQuizDetailPage from './pages/TeacherQuizDetailPage';
import TeacherAttendancePage from './pages/TeacherAttendancePage';
import TeacherAssignmentsPage from './pages/TeacherAssignmentsPage';
import TeacherAIPage from './pages/TeacherAIPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminLeadsPage from './pages/AdminLeadsPage';
import AdminCoursesPage from './pages/AdminCoursesPage';
import AdminCourseDetailPage from './pages/AdminCourseDetailPage';
import AdminBatchesPage from './pages/AdminBatchesPage';
import AdminBatchDetailPage from './pages/AdminBatchDetailPage';
import AdminEnrollmentPage from './pages/AdminEnrollmentPage';
import AdminPaymentsPage from './pages/AdminPaymentsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import SupportPage from './pages/SupportPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminVisitorsPage from './pages/AdminVisitorsPage';
import AdminLoginHistoryPage from './pages/AdminLoginHistoryPage';
import AdminReportsPage from './pages/AdminReportsPage';
import AdminAIPage from './pages/AdminAIPage';
import OAuth2CallbackPage from './pages/OAuth2CallbackPage';

function T(role: 'STUDENT' | 'TEACHER' | 'ADMIN', el: React.ReactNode) {
  return <ProtectedRoute role={role}>{el}</ProtectedRoute>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/oauth2/callback" element={<OAuth2CallbackPage />} />

        {/* Guest only */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />

        {/* Student */}
        <Route path="/student" element={T('STUDENT', <StudentDashboard />)} />
        <Route path="/student/courses" element={T('STUDENT', <StudentCoursesPage />)} />
        <Route path="/student/browse" element={T('STUDENT', <StudentExplorePage />)} />
        <Route path="/student/schedule" element={T('STUDENT', <StudentSchedulePage />)} />
        <Route path="/student/quizzes" element={T('STUDENT', <StudentQuizzesPage />)} />
        <Route path="/student/quizzes/:id" element={T('STUDENT', <StudentQuizPage />)} />
        <Route path="/student/attendance" element={T('STUDENT', <StudentAttendancePage />)} />
        <Route path="/student/announcements" element={T('STUDENT', <StudentAnnouncementsPage />)} />
        <Route path="/student/payments" element={T('STUDENT', <StudentPaymentsPage />)} />
        <Route path="/student/assignments" element={T('STUDENT', <StudentAssignmentsPage />)} />
        <Route path="/student/progress" element={T('STUDENT', <StudentProgressPage />)} />
        <Route path="/student/ai" element={T('STUDENT', <StudentAIPage />)} />
        <Route path="/student/profile" element={T('STUDENT', <ProfilePage />)} />
        <Route path="/student/settings" element={T('STUDENT', <SettingsPage />)} />
        <Route path="/student/support" element={T('STUDENT', <SupportPage />)} />
        <Route path="/student/notifications" element={T('STUDENT', <NotificationsPage />)} />

        {/* Teacher */}
        <Route path="/teacher" element={T('TEACHER', <TeacherDashboard />)} />
        <Route path="/teacher/batches" element={T('TEACHER', <TeacherBatchesPage />)} />
        <Route path="/teacher/batches/:id" element={T('TEACHER', <TeacherBatchDetailPage />)} />
        <Route path="/teacher/students" element={T('TEACHER', <TeacherStudentsPage />)} />
        <Route path="/teacher/materials" element={T('TEACHER', <TeacherMaterialsPage />)} />
        <Route path="/teacher/quizzes" element={T('TEACHER', <TeacherQuizzesPage />)} />
        <Route path="/teacher/quizzes/:id" element={T('TEACHER', <TeacherQuizDetailPage />)} />
        <Route path="/teacher/assignments" element={T('TEACHER', <TeacherAssignmentsPage />)} />
        <Route path="/teacher/ai" element={T('TEACHER', <TeacherAIPage />)} />
        <Route path="/teacher/batches/:batchId/sessions/:sessionId/attendance" element={T('TEACHER', <TeacherAttendancePage />)} />
        <Route path="/teacher/profile" element={T('TEACHER', <ProfilePage />)} />
        <Route path="/teacher/settings" element={T('TEACHER', <SettingsPage />)} />
        <Route path="/teacher/support" element={T('TEACHER', <SupportPage />)} />
        <Route path="/teacher/notifications" element={T('TEACHER', <NotificationsPage />)} />

        {/* Admin */}
        <Route path="/admin" element={T('ADMIN', <AdminDashboard />)} />
        <Route path="/admin/users" element={T('ADMIN', <AdminUsersPage />)} />
        <Route path="/admin/leads" element={T('ADMIN', <AdminLeadsPage />)} />
        <Route path="/admin/courses" element={T('ADMIN', <AdminCoursesPage />)} />
        <Route path="/admin/courses/:id" element={T('ADMIN', <AdminCourseDetailPage />)} />
        <Route path="/admin/batches" element={T('ADMIN', <AdminBatchesPage />)} />
        <Route path="/admin/batches/:id" element={T('ADMIN', <AdminBatchDetailPage />)} />
        <Route path="/admin/batches/:batchId/sessions/:sessionId/attendance" element={T('ADMIN', <TeacherAttendancePage />)} />
        <Route path="/admin/enrollments" element={T('ADMIN', <AdminEnrollmentPage />)} />
        <Route path="/admin/payments" element={T('ADMIN', <AdminPaymentsPage />)} />
        <Route path="/admin/profile" element={T('ADMIN', <ProfilePage />)} />
        <Route path="/admin/settings" element={T('ADMIN', <SettingsPage />)} />
        <Route path="/admin/support" element={T('ADMIN', <SupportPage />)} />
        <Route path="/admin/notifications" element={T('ADMIN', <NotificationsPage />)} />
        <Route path="/admin/visitors" element={T('ADMIN', <AdminVisitorsPage />)} />
        <Route path="/admin/login-history" element={T('ADMIN', <AdminLoginHistoryPage />)} />
        <Route path="/admin/reports" element={T('ADMIN', <AdminReportsPage />)} />
        <Route path="/admin/ai" element={T('ADMIN', <AdminAIPage />)} />
      </Routes>
    </BrowserRouter>
  );
}
