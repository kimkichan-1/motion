import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ModelManagement from './pages/ModelManagement'
import MotionLibrary from './pages/MotionLibrary'
import MotionCapture from './pages/MotionCapture'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="models" element={<ModelManagement />} />
          <Route path="motions" element={<MotionLibrary />} />
          <Route path="capture" element={<MotionCapture />} />
          <Route path="dashboard" element={<Dashboard />} />
        </Route>
        <Route path="*" element={<HomePage />} />
      </Routes>
    </div>
  )
}

export default App