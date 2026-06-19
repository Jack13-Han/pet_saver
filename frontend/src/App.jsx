import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import { Menu } from 'lucide-react'
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
import Insights from './pages/Insights.jsx'
import ExpenseAnalyst from './pages/ExpenseAnalyst.jsx'

function App() {
  const { user, loading } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="main-content">
        <div className="mobile-header lg:hidden">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 text-slate-600">
            <Menu size={24} />
          </button>
          <div className="font-extrabold text-lg flex items-center gap-2">
            <span className="text-xl">🐾</span> Pet Saver
          </div>
          <div className="w-10"></div>
        </div>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/expense-analyst" element={<ExpenseAnalyst />} />
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
