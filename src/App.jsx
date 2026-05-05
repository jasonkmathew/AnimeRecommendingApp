import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import AppShell from './components/layout/AppShell';
import HomePage from './pages/HomePage';
import DiscoverPage from './pages/DiscoverPage';
import AnimeDetailPage from './pages/AnimeDetailPage';
import ProfilePage from './pages/ProfilePage';
import MatchPage from './pages/MatchPage';
import './index.css';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/discover" element={<DiscoverPage />} />
              <Route path="/anime/:id" element={<AnimeDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/match" element={<MatchPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
