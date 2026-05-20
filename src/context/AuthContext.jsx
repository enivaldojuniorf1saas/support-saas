import { createContext, useContext } from 'react'
import { useAuth } from '../hooks/useAuth'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const auth = useAuth()
    return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export const useAuthContext = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuthContext deve ser usado dentro de AuthProvider')
    return ctx
}