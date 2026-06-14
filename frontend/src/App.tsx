import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAppStore } from './store';
import { AuditLogPage } from './pages/AuditLogPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { NewEncounterPage } from './pages/NewEncounterPage';
import { PatientDetailPage } from './pages/PatientDetailPage';
import { PatientsPage } from './pages/PatientsPage';
import { RegisterPatientPage } from './pages/RegisterPatientPage';
import { SurveillancePage } from './pages/SurveillancePage';

function LanguageSync() {
  const language = useAppStore((state) => state.language);
  const i18n = useTranslation().i18n;

  useEffect(() => {
    if (i18n.language !== language) {
      void i18n.changeLanguage(language);
    }
  }, [i18n, language]);

  return null;
}

export default function App() {
  return (
    <>
      <LanguageSync />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}> 
          <Route element={<AppLayout />}> 
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/patients/:id" element={<PatientDetailPage />} />
            <Route path="/patients/new" element={<RegisterPatientPage />} />
            <Route path="/encounters/new" element={<NewEncounterPage />} />
            <Route element={<ProtectedRoute allowedRoles={[ 'doctor', 'admin' ]} />}> 
              <Route path="/surveillance" element={<SurveillancePage />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={[ 'admin' ]} />}> 
              <Route path="/audit" element={<AuditLogPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}