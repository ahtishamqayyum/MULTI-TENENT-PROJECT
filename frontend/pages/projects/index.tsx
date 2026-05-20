/**
 * Projects list: tenant-scoped cards, create form, delete.
 * Data from API; 401 clears storage and redirects to login.
 */
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { projectsAPI, Project } from '../../lib/api'

export default function ProjectsList() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    
    if (!token) {
      router.push('/login')
      return
    }

    if (userStr) {
      setUser(JSON.parse(userStr))
    }

    loadProjects()

    // Inject animation styles
    const styleSheet = document.createElement('style')
    styleSheet.textContent = animationStyles
    document.head.appendChild(styleSheet)

    return () => {
      if (document.head.contains(styleSheet)) {
        document.head.removeChild(styleSheet)
      }
    }
  }, [router])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const data = await projectsAPI.getAll()
      setProjects(data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load projects')
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createName.trim()) {
      setError('Project name is required')
      return
    }

    try {
      setCreating(true)
      setError('')
      await projectsAPI.create(createName, createDescription)
      setCreateName('')
      setCreateDescription('')
      setShowCreateForm(false)
      await loadProjects()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return
    }

    try {
      await projectsAPI.delete(id)
      await loadProjects()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete project')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (loading && projects.length === 0) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <div style={styles.loading}>Loading projects...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.backgroundAnimation}></div>
      <div style={styles.container}>
        <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.titleContainer}>
            <h1 style={styles.title}>Projects</h1>
            <div style={styles.titleUnderline}></div>
          </div>
          {user && (
            <div style={styles.userInfo}>
              <span style={styles.badge}>🏢 {user.tenant_name || `ID: ${user.tenant_id}`}</span>
              <span style={styles.badge}>👤 {user.name}</span>
            </div>
          )}
        </div>
        <div style={styles.headerActions}>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)} 
            style={styles.button}
            data-primary="true"
          >
            {showCreateForm ? 'Cancel' : '+ New Project'}
          </button>
          <button 
            onClick={handleLogout} 
            style={styles.logoutButton}
            data-danger="true"
          >
            Logout
          </button>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {showCreateForm && (
        <div style={styles.createForm}>
          <h2 style={styles.formTitle}>Create New Project</h2>
          <form onSubmit={handleCreate}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Project Name *</label>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                required
                style={styles.input}
                placeholder="Enter project name"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                style={styles.textarea}
                placeholder="Enter project description"
                rows={4}
              />
            </div>
            <button 
              type="submit" 
              disabled={creating} 
              style={styles.button}
              data-primary="true"
            >
              {creating ? 'Creating...' : 'Create Project'}
            </button>
          </form>
        </div>
      )}

      <div style={styles.projectsGrid}>
        {projects.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No projects found. Create your first project!</p>
          </div>
        ) : (
          projects.map((project, index) => (
            <div 
              key={project.id} 
              data-project-card="true"
              style={{
                ...styles.projectCard,
                animationDelay: `${index * 0.1}s`
              }}
            >
              <h3 style={styles.projectName}>{project.name}</h3>
              <p style={styles.projectDescription}>
                {project.description || 'No description'}
              </p>
              <div style={styles.projectMeta}>
                <p style={styles.metaText}>
                  Created by: {project.created_by_name || 'Unknown'}
                </p>
                <p style={styles.metaText}>
                  {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>
              <div style={styles.projectActions}>
                <button
                  onClick={() => router.push(`/projects/${project.id}`)}
                  style={styles.viewButton}
                  data-primary="true"
                >
                  View
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
                  style={styles.deleteButton}
                  data-danger="true"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      </div>
    </div>
  )
}

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    width: '100%',
    background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem',
    position: 'relative' as const,
    zIndex: 1,
  },
  backgroundAnimation: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(15, 32, 39, 0.1) 0%, rgba(32, 58, 67, 0.1) 50%, rgba(44, 83, 100, 0.1) 100%)',
    animation: 'gradientShift 20s ease infinite',
    zIndex: 0,
    pointerEvents: 'none' as const,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(200, 220, 240, 0.2) 100%)',
    backdropFilter: 'blur(15px)',
    padding: '2rem',
    borderRadius: '20px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.2)',
    position: 'relative' as const,
    zIndex: 1,
    animation: 'slideInDown 0.6s ease-out',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flex: 1,
  },
  titleContainer: {
    marginBottom: '1rem',
  },
  title: {
    margin: '0 0 0.5rem 0',
    fontSize: '2.5rem',
    background: 'linear-gradient(135deg, #ffffff 0%, #c8dcf0 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    fontWeight: 'bold',
  },
  titleUnderline: {
    width: '80px',
    height: '4px',
    background: 'linear-gradient(90deg, #ffffff 0%, #c8dcf0 100%)',
    borderRadius: '2px',
    animation: 'expandWidth 1s ease-out 0.3s both',
  },
  userInfo: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap' as const,
    marginTop: '0.5rem',
  },
  badge: {
    display: 'inline-block',
    padding: '0.4rem 0.8rem',
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(200, 220, 240, 0.3) 100%)',
    color: '#ffffff',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: '500',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  headerActions: {
    display: 'flex',
    gap: '1rem',
  },
  button: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(200, 220, 240, 0.3) 100%)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '12px',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    backdropFilter: 'blur(10px)',
  },
  logoutButton: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, rgba(201, 75, 75, 0.4) 0%, rgba(75, 19, 79, 0.5) 100%)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(201, 75, 75, 0.3)',
    backdropFilter: 'blur(10px)',
  },
  error: {
    background: 'linear-gradient(135deg, #fee 0%, #fcc 100%)',
    color: '#c53030',
    padding: '1rem 1.5rem',
    borderRadius: '12px',
    marginBottom: '1rem',
    border: '2px solid #fc8181',
    animation: 'shake 0.5s ease-in-out',
    boxShadow: '0 4px 12px rgba(197, 48, 48, 0.2)',
    position: 'relative' as const,
    zIndex: 1,
  },
  createForm: {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(200, 220, 240, 0.2) 100%)',
    backdropFilter: 'blur(15px)',
    padding: '2rem',
    borderRadius: '20px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
    marginBottom: '2rem',
    animation: 'slideInUp 0.6s ease-out',
    position: 'relative' as const,
    zIndex: 1,
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  formTitle: {
    margin: '0 0 1.5rem 0',
    fontSize: '1.5rem',
    color: '#ffffff',
    fontWeight: 'bold',
  },
  formGroup: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#ffffff',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '0.875rem 1rem',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    fontSize: '1rem',
    boxSizing: 'border-box' as const,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    transition: 'all 0.3s ease',
    outline: 'none',
    backdropFilter: 'blur(10px)',
  },
  textarea: {
    width: '100%',
    padding: '0.875rem 1rem',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    fontSize: '1rem',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    transition: 'all 0.3s ease',
    outline: 'none',
    backdropFilter: 'blur(10px)',
  },
  projectsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  projectCard: {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(200, 220, 240, 0.2) 100%)',
    backdropFilter: 'blur(15px)',
    padding: '1.5rem',
    borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2)',
    display: 'flex',
    flexDirection: 'column' as const,
    transition: 'all 0.3s ease',
    position: 'relative' as const,
    zIndex: 1,
    animation: 'fadeInUp 0.6s ease-out both',
    overflow: 'hidden' as const,
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  projectName: {
    margin: '0 0 0.5rem 0',
    fontSize: '1.5rem',
    background: 'linear-gradient(135deg, #ffffff 0%, #c8dcf0 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    fontWeight: 'bold',
  },
  projectDescription: {
    margin: '0 0 1rem 0',
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '0.95rem',
    flexGrow: 1,
    lineHeight: '1.6',
  },
  projectMeta: {
    marginBottom: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #eee',
  },
  metaText: {
    margin: '0.25rem 0',
    fontSize: '0.85rem',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  projectActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  viewButton: {
    flex: 1,
    padding: '0.75rem',
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(200, 220, 240, 0.3) 100%)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(10px)',
  },
  deleteButton: {
    flex: 1,
    padding: '0.75rem',
    background: 'linear-gradient(135deg, rgba(201, 75, 75, 0.4) 0%, rgba(75, 19, 79, 0.5) 100%)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(201, 75, 75, 0.3)',
    backdropFilter: 'blur(10px)',
  },
  emptyState: {
    gridColumn: '1 / -1',
    textAlign: 'center' as const,
    padding: '3rem',
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(200, 220, 240, 0.2) 100%)',
    backdropFilter: 'blur(15px)',
    borderRadius: '20px',
    color: '#ffffff',
    fontSize: '1.1rem',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    position: 'relative' as const,
    zIndex: 1,
    animation: 'fadeInUp 0.6s ease-out',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    position: 'relative' as const,
    zIndex: 1,
  },
  loadingSpinner: {
    width: '50px',
    height: '50px',
    border: '4px solid rgba(255, 255, 255, 0.3)',
    borderTop: '4px solid #2c5364',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
  },
  loading: {
    textAlign: 'center' as const,
    padding: '1rem',
    fontSize: '1.2rem',
    color: 'white',
    fontWeight: '500',
  },
}

// CSS Animations
const animationStyles = `
  @keyframes slideInDown {
    from {
      opacity: 0;
      transform: translateY(-30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

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

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
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
      width: 80px;
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

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* Card hover effects */
  [data-project-card] {
    transition: all 0.3s ease;
  }

  [data-project-card]:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2) !important;
  }

  /* Button hover effects */
  button:hover {
    transform: translateY(-2px);
  }

  button[data-primary]:hover {
    box-shadow: 0 6px 20px rgba(15, 32, 39, 0.5) !important;
  }

  button[data-danger]:hover {
    box-shadow: 0 6px 20px rgba(201, 75, 75, 0.5) !important;
  }

  /* Input focus effects */
  input:focus, textarea:focus {
    border-color: rgba(255, 255, 255, 0.5) !important;
    background-color: rgba(255, 255, 255, 0.2) !important;
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1) !important;
    transform: translateY(-2px);
  }

  input::placeholder, textarea::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`





