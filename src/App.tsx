import "./App.css";

import { Routes, Route } from "react-router-dom";
import { StandalonePageTransition } from "./components/motion/PageTransition";
import { MainLayout } from "./layouts/MainLayout";
import { HomePage } from "./pages/home/HomePage";
import { ContactPage } from "./pages/contact/ContactPage";
import { PersonalServicesPage } from "./pages/services/PersonalServicesPage";
import { BusinessServicesPage } from "./pages/services/BusinessServicesPage";
import EventPage from "./pages/events/EventPage";
import LoginPage from "./pages/auth/LoginPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import AdminPage from "./pages/admin/AdminPage";
import { ProtectedRoute } from "./features/auth/ProtectedRoute";
import { AgendarPage } from "./pages/agendar/AgendarPage";
import { MisReservasPage } from "./pages/reservas/MisReservasPage";

// ✅ NUEVO
import PrivacyPage from "./pages/legal/PrivacyPage";
import TermsPage from "./pages/legal/TermsPage";

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/contacto" element={<ContactPage />} />
          <Route path="/agendar" element={<AgendarPage />} />
          <Route path="/mis-reservas" element={<MisReservasPage />} />
          <Route path="/servicios" element={<PersonalServicesPage />} />
          <Route path="/empresas" element={<BusinessServicesPage />} />
          <Route path="/eventos" element={<EventPage />} />

          {/* ✅ NUEVO: Legal */}
          <Route path="/privacidad" element={<PrivacyPage />} />
          <Route path="/terminos" element={<TermsPage />} />
        </Route>

        <Route
          path="/login"
          element={
            <StandalonePageTransition>
              <LoginPage />
            </StandalonePageTransition>
          }
        />
        <Route
          path="/reset-password"
          element={
            <StandalonePageTransition>
              <ResetPasswordPage />
            </StandalonePageTransition>
          }
        />
        <Route
          path="/admin"
          element={
            <StandalonePageTransition>
              <ProtectedRoute requiredRole="admin">
                <AdminPage />
              </ProtectedRoute>
            </StandalonePageTransition>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
