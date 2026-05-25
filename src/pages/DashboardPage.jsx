import { useAuthContext } from '../context/AuthContext'
import { Link } from 'react-router-dom'

export function DashboardPage() {
  const { profile, signOut } = useAuthContext()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
     

      {/* Embed Looker Studio */}
      <div className="w-full h-[calc(100vh-65px)]">
       <span> EM BREVE</span>
      </div>
    </div>
  )
}