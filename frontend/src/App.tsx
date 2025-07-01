// Arquivo: frontend/src/App.tsx

import { Routes, Route, Navigate } from 'react-router-dom'; // 1. Remova o import do BrowserRouter
import { LoginPage } from './pages/LoginPage';
import { ChatPage } from './pages/ChatPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    // 2. Remova o <BrowserRouter> daqui
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/chat" element={<ChatPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;