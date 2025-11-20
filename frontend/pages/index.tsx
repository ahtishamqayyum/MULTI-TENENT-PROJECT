import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token')
    
    if (token) {
      // If authenticated, redirect to projects
      router.push('/projects')
    } else {
      // If not authenticated, redirect to login
      router.push('/login')
    }
  }, [router])

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '1.2rem'
    }}>
      Redirecting...
    </div>
  )
}

