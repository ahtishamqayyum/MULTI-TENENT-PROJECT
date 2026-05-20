/**
 * Login / register / forgot-password UI.
 * Stores token + user in localStorage on successful login.
 */
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { authAPI, Tenant } from '../lib/api'

export default function Login() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [tenantId, setTenantId] = useState<number>(0)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [resetPassword, setResetPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    // Load tenants for registration
    if (!isLogin) {
      authAPI.getTenants()
        .then(setTenants)
        .catch((err) => {
          console.error('Failed to load tenants:', err)
        })
    }

    // Inject animation styles
    const styleSheet = document.createElement('style')
    styleSheet.textContent = animationStyles
    document.head.appendChild(styleSheet)

    return () => {
      document.head.removeChild(styleSheet)
    }
  }, [isLogin])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await authAPI.login(email, password)
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      router.push('/projects')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (!tenantId) {
      setError('Please select a tenant')
      setLoading(false)
      return
    }

    try {
      await authAPI.register(email, password, name, tenantId)
      setSuccess('Account created successfully! Please login.')
      // Switch to login mode after successful registration
      setTimeout(() => {
        setIsLogin(true)
        setSuccess('')
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (!forgotEmail) {
      setError('Please enter your email address')
      setLoading(false)
      return
    }

    try {
      await authAPI.forgotPassword(forgotEmail)
      setResetPassword(true)
      setSuccess('Please enter your new password')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process request')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (!newPassword || !confirmPassword) {
      setError('Please fill all fields')
      setLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      await authAPI.resetPassword(forgotEmail, newPassword)
      setSuccess('Password reset successfully! Please login with your new password.')
      setTimeout(() => {
        setShowForgotPassword(false)
        setResetPassword(false)
        setForgotEmail('')
        setNewPassword('')
        setConfirmPassword('')
        setSuccess('')
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.backgroundAnimation}></div>
      <div style={styles.card}>
        <div style={styles.titleContainer}>
        <h1 style={styles.title}>Multi-Tenant Projects</h1>
          <div style={styles.titleUnderline}></div>
        </div>
        
        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}
        
        {showForgotPassword ? (
          !resetPassword ? (
            <form onSubmit={handleForgotPassword} style={styles.form}>
              <h2 style={styles.forgotPasswordTitle}>Forgot Password</h2>
              <p style={styles.forgotPasswordText}>Enter your email address to reset your password</p>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Email:</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  style={styles.input}
                  placeholder="Enter your email"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea'
                    e.target.style.backgroundColor = '#fff'
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
                    e.target.style.transform = 'translateY(-2px)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0'
                    e.target.style.backgroundColor = '#f7fafc'
                    e.target.style.boxShadow = 'none'
                    e.target.style.transform = 'translateY(0)'
                  }}
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                style={{
                  ...styles.button,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)'
                    e.currentTarget.style.background = 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)'
                    e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }
                }}
              >
                {loading ? 'Processing...' : 'Continue'}
              </button>

              <div style={styles.switchContainer}>
                <p style={styles.switchText}>
                  Remember your password?{' '}
                  <a href="#" onClick={(e) => { e.preventDefault(); setShowForgotPassword(false); setError(''); setSuccess(''); }} style={styles.switchLink}>
                    Back to Login
                  </a>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} style={styles.form}>
              <h2 style={styles.forgotPasswordTitle}>Reset Password</h2>
              <p style={styles.forgotPasswordText}>Enter your new password</p>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>New Password:</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={styles.input}
                  placeholder="Enter new password"
                  minLength={6}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea'
                    e.target.style.backgroundColor = '#fff'
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
                    e.target.style.transform = 'translateY(-2px)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0'
                    e.target.style.backgroundColor = '#f7fafc'
                    e.target.style.boxShadow = 'none'
                    e.target.style.transform = 'translateY(0)'
                  }}
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Confirm Password:</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={styles.input}
                  placeholder="Confirm new password"
                  minLength={6}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea'
                    e.target.style.backgroundColor = '#fff'
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
                    e.target.style.transform = 'translateY(-2px)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0'
                    e.target.style.backgroundColor = '#f7fafc'
                    e.target.style.boxShadow = 'none'
                    e.target.style.transform = 'translateY(0)'
                  }}
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                style={{
                  ...styles.button,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)'
                    e.currentTarget.style.background = 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)'
                    e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }
                }}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>

              <div style={styles.switchContainer}>
                <p style={styles.switchText}>
                  Remember your password?{' '}
                  <a href="#" onClick={(e) => { e.preventDefault(); setShowForgotPassword(false); setResetPassword(false); setError(''); setSuccess(''); }} style={styles.switchLink}>
                    Back to Login
                  </a>
                </p>
              </div>
            </form>
          )
        ) : isLogin ? (
          <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              placeholder="Enter your email"
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea'
                e.target.style.backgroundColor = '#fff'
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
                e.target.style.transform = 'translateY(-2px)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0'
                e.target.style.backgroundColor = '#f7fafc'
                e.target.style.boxShadow = 'none'
                e.target.style.transform = 'translateY(0)'
              }}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
              placeholder="Enter your password"
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea'
                e.target.style.backgroundColor = '#fff'
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
                e.target.style.transform = 'translateY(-2px)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0'
                e.target.style.backgroundColor = '#f7fafc'
                e.target.style.boxShadow = 'none'
                e.target.style.transform = 'translateY(0)'
              }}
            />
          </div>
          
            <div style={styles.forgotPasswordContainer}>
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault()
                  setShowForgotPassword(true)
                  setError('')
                  setSuccess('')
                }}
                style={styles.forgotPasswordLink}
              >
                Forgot Password?
              </a>
            </div>
            
            <button 
              type="submit" 
              disabled={loading} 
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)'
                  e.currentTarget.style.background = 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)'
                  e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }
              }}
            >
            {loading ? 'Logging in...' : 'Login'}
          </button>

            <div style={styles.switchContainer}>
              <p style={styles.switchText}>
                Don't have an account?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(false); setError(''); setSuccess(''); }} style={styles.switchLink}>
                  Create Account
                </a>
              </p>
            </div>
        </form>
        ) : (
          <form onSubmit={handleRegister} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Name:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={styles.input}
                placeholder="Your Name"
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea'
                  e.target.style.backgroundColor = '#fff'
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
                  e.target.style.transform = 'translateY(-2px)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0'
                  e.target.style.backgroundColor = '#f7fafc'
                  e.target.style.boxShadow = 'none'
                  e.target.style.transform = 'translateY(0)'
                }}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
                placeholder="your@email.com"
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea'
                  e.target.style.backgroundColor = '#fff'
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
                  e.target.style.transform = 'translateY(-2px)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0'
                  e.target.style.backgroundColor = '#f7fafc'
                  e.target.style.boxShadow = 'none'
                  e.target.style.transform = 'translateY(0)'
                }}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.input}
                placeholder="Choose a password"
                minLength={6}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea'
                  e.target.style.backgroundColor = '#fff'
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
                  e.target.style.transform = 'translateY(-2px)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0'
                  e.target.style.backgroundColor = '#f7fafc'
                  e.target.style.boxShadow = 'none'
                  e.target.style.transform = 'translateY(0)'
                }}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Tenant:</label>
              <select
                value={tenantId}
                onChange={(e) => setTenantId(Number(e.target.value))}
                required
                style={styles.input}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea'
                  e.target.style.backgroundColor = '#fff'
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
                  e.target.style.transform = 'translateY(-2px)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0'
                  e.target.style.backgroundColor = '#f7fafc'
                  e.target.style.boxShadow = 'none'
                  e.target.style.transform = 'translateY(0)'
                }}
              >
                <option value="">Select a tenant</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </div>
            
            <button 
              type="submit" 
              disabled={loading} 
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)'
                  e.currentTarget.style.background = 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)'
                  e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }
              }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <div style={styles.switchContainer}>
              <p style={styles.switchText}>
                Already have an account?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(true); setError(''); setSuccess(''); }} style={styles.switchLink}>
                  Login
                </a>
              </p>
        </div>
          </form>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    padding: '1rem',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  backgroundAnimation: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 50%, rgba(240, 147, 251, 0.1) 100%)',
    animation: 'gradientShift 15s ease infinite',
    zIndex: 0,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    padding: '2.5rem',
    borderRadius: '20px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
    width: '100%',
    maxWidth: '450px',
    position: 'relative' as const,
    zIndex: 1,
    animation: 'slideInUp 0.6s ease-out',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },
  titleContainer: {
    marginBottom: '2rem',
    textAlign: 'center' as const,
  },
  title: {
    margin: '0 0 0.5rem 0',
    fontSize: '2rem',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textAlign: 'center' as const,
    animation: 'fadeInDown 0.8s ease-out',
  },
  titleUnderline: {
    width: '60px',
    height: '4px',
    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
    margin: '0 auto',
    borderRadius: '2px',
    animation: 'expandWidth 1s ease-out 0.3s both',
  },
  subtitle: {
    margin: '0 0 2rem 0',
    fontSize: '1rem',
    color: '#666',
    textAlign: 'center' as const,
    fontWeight: 'normal',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    animation: 'fadeIn 0.8s ease-out 0.2s both',
  },
  formGroup: {
    marginBottom: '1.5rem',
    animation: 'fadeInUp 0.6s ease-out both',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#4a5568',
    fontWeight: '600',
    fontSize: '0.9rem',
    transition: 'color 0.3s ease',
  },
  input: {
    width: '100%',
    padding: '0.875rem 1rem',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '1rem',
    boxSizing: 'border-box' as const,
    transition: 'all 0.3s ease',
    outline: 'none',
    backgroundColor: '#f7fafc',
    color: '#2d3748',
  },
  button: {
    padding: '0.875rem 1.5rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '0.5rem',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  error: {
    backgroundColor: '#fee',
    color: '#c53030',
    padding: '0.875rem 1rem',
    borderRadius: '10px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
    border: '2px solid #fc8181',
    animation: 'shake 0.5s ease-in-out',
    boxShadow: '0 2px 8px rgba(197, 48, 48, 0.2)',
  },
  success: {
    background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
    color: 'white',
    padding: '0.875rem 1rem',
    borderRadius: '10px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
    border: 'none',
    animation: 'slideInDown 0.5s ease-out',
    boxShadow: '0 4px 12px rgba(72, 187, 120, 0.3)',
  },
  switchContainer: {
    marginTop: '1.5rem',
    textAlign: 'center' as const,
    paddingTop: '1rem',
    borderTop: '2px solid #e2e8f0',
    animation: 'fadeIn 0.8s ease-out 0.4s both',
  },
  switchText: {
    margin: 0,
    color: '#718096',
    fontSize: '0.9rem',
  },
  switchLink: {
    color: '#667eea',
    textDecoration: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    position: 'relative' as const,
    display: 'inline-block' as const,
  },
  forgotPasswordContainer: {
    textAlign: 'right' as const,
    marginBottom: '1rem',
    marginTop: '-0.5rem',
  },
  forgotPasswordLink: {
    color: '#667eea',
    textDecoration: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
    position: 'relative' as const,
    display: 'inline-block' as const,
  },
  forgotPasswordTitle: {
    margin: '0 0 0.5rem 0',
    fontSize: '1.5rem',
    color: '#333',
    textAlign: 'center' as const,
  },
  forgotPasswordText: {
    margin: '0 0 1.5rem 0',
    color: '#666',
    fontSize: '0.9rem',
    textAlign: 'center' as const,
  },
}

// CSS animations
const animationStyles = `
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes expandWidth {
    from {
      width: 0;
    }
    to {
      width: 60px;
    }
  }

  @keyframes gradientShift {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }

  @keyframes shake {
    0%, 100% {
      transform: translateX(0);
    }
    10%, 30%, 50%, 70%, 90% {
      transform: translateX(-5px);
    }
    20%, 40%, 60%, 80% {
      transform: translateX(5px);
    }
  }

  @keyframes slideInDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  input:hover {
    border-color: #cbd5e0 !important;
    background-color: #fff !important;
  }

  a:hover {
    color: #764ba2 !important;
    transform: scale(1.05);
  }

  a::after {
    content: '';
    position: absolute;
    width: 0;
    height: 2px;
    bottom: -2px;
    left: 0;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    transition: width 0.3s ease;
  }

  a:hover::after {
    width: 100%;
  }
`

