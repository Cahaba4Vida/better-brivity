import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Workflows from './pages/Workflows'
import Skills from './pages/Skills'
import Templates from './pages/Templates'
import './styles/globals.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="clients/:id" element={<ClientDetail />} />
          <Route path="workflows" element={<Workflows />} />
          <Route path="skills" element={<Skills />} />
          <Route path="templates" element={<Templates />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
