import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Sidebar from './components/Sidebar.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Goals from './pages/Goals.jsx'
import Transactions from './pages/Transactions.jsx'
import Shop from './pages/Shop.jsx'
import Achievements from './pages/Achievements.jsx'
import ReceiptScanner from './pages/ReceiptScanner.jsx'
import Rankings from './pages/Rankings.jsx'
import Settings from './pages/Settings.jsx'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-paw">🐾</div>
        <p>Loading Pet Saver...</p>
      </div>
    )
  }

  if (!user) return <Login />

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/scanner" element={<ReceiptScanner />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
