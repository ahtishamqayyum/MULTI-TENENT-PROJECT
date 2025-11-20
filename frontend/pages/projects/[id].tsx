import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { projectsAPI, Project } from '../../lib/api'

export default function ProjectDetail() {
  const router = useRouter()
  const { id } = router.query
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (id) {
      loadProject()
    }

    // Inject animation styles
    const styleSheet = document.createElement('style')
    styleSheet.textContent = animationStyles
    document.head.appendChild(styleSheet)

    return () => {
      if (document.head.contains(styleSheet)) {
        document.head.removeChild(styleSheet)
      }
    }
  }, [id])

  const loadProject = async () => {
    try {
      setLoading(true)
      const data = await projectsAPI.getById(Number(id))
      setProject(data)
      setEditName(data.name)
      setEditDescription(data.description || '')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load project')
      if (err.response?.status === 404) {
        setTimeout(() => router.push('/projects'), 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editName.trim()) {
      setError('Project name is required')
      return
    }

    try {
      setUpdating(true)
      setError('')
      const updated = await projectsAPI.update(Number(id), editName, editDescription)
      setProject(updated)
      setEditing(false)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update project')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return
    }

    try {
      await projectsAPI.delete(Number(id))
      router.push('/projects')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete project')
    }
  }

  if (loading) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <div style={styles.loading}>Loading project...</div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.error}>Project not found. Redirecting...</div>
      </div>
    )
  }

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.backgroundAnimation}></div>
      <div style={styles.container}>
        <div style={styles.header}>
        <button 
          onClick={() => router.push('/projects')} 
          style={styles.backButton}
          data-primary="true"
        >
          ← Back to Projects
        </button>
        <div style={styles.headerActions}>
          {!editing && (
            <>
              <button 
                onClick={() => setEditing(true)} 
                style={styles.editButton}
                data-primary="true"
              >
                Edit
              </button>
              <button 
                onClick={handleDelete} 
                style={styles.deleteButton}
                data-danger="true"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {editing ? (
        <div style={styles.card}>
          <h1 style={styles.title}>Edit Project</h1>
          <form onSubmit={handleUpdate}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Project Name *</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                style={styles.textarea}
                rows={6}
              />
            </div>
            <div style={styles.formActions}>
              <button 
                type="submit" 
                disabled={updating} 
                style={styles.button}
                data-primary="true"
              >
                {updating ? 'Updating...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false)
                  setEditName(project.name)
                  setEditDescription(project.description || '')
                  setError('')
                }}
                style={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div style={styles.card}>
          <h1 style={styles.title}>{project.name}</h1>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Description</h2>
            <p style={styles.description}>
              {project.description || 'No description provided'}
            </p>
          </div>
          <div style={styles.meta}>
            <div style={styles.metaItem}>
              <strong>Created by:</strong> {project.created_by_name || 'Unknown'}
            </div>
            {project.created_by_email && (
              <div style={styles.metaItem}>
                <strong>Email:</strong> {project.created_by_email}
              </div>
            )}
            <div style={styles.metaItem}>
              <strong>Created:</strong>{' '}
              {new Date(project.created_at).toLocaleString()}
            </div>
            <div style={styles.metaItem}>
              <strong>Last updated:</strong>{' '}
              {new Date(project.updated_at).toLocaleString()}
            </div>
          </div>
        </div>
      )}
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
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '2rem',
    position: 'relative' as const,
    zIndex: 1,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    animation: 'slideInDown 0.6s ease-out',
  },
  backButton: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(200, 220, 240, 0.3) 100%)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(10px)',
  },
  headerActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  editButton: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(200, 220, 240, 0.3) 100%)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(10px)',
  },
  deleteButton: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, rgba(201, 75, 75, 0.4) 0%, rgba(75, 19, 79, 0.5) 100%)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(201, 75, 75, 0.3)',
    backdropFilter: 'blur(10px)',
  },
  card: {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(200, 220, 240, 0.2) 100%)',
    backdropFilter: 'blur(15px)',
    padding: '2.5rem',
    borderRadius: '20px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    animation: 'slideInUp 0.6s ease-out',
  },
  title: {
    margin: '0 0 2rem 0',
    fontSize: '2.5rem',
    background: 'linear-gradient(135deg, #ffffff 0%, #c8dcf0 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: '2rem',
    padding: '1.5rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '15px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    margin: '0 0 1rem 0',
    fontSize: '1.5rem',
    color: '#ffffff',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #ffffff 0%, #c8dcf0 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  description: {
    margin: 0,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: '1.8',
    fontSize: '1.1rem',
  },
  meta: {
    paddingTop: '2rem',
    borderTop: '2px solid rgba(255, 255, 255, 0.2)',
    marginTop: '2rem',
  },
  metaItem: {
    marginBottom: '1rem',
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: '1rem',
    padding: '0.75rem 1rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  formGroup: {
    marginBottom: '1.5rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#ffffff',
    fontWeight: '600',
    fontSize: '1rem',
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
  formActions: {
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
    backdropFilter: 'blur(10px)',
  },
  cancelButton: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, rgba(108, 117, 125, 0.4) 0%, rgba(73, 80, 87, 0.5) 100%)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(10px)',
  },
  error: {
    background: 'linear-gradient(135deg, rgba(197, 48, 48, 0.3) 0%, rgba(252, 129, 129, 0.4) 100%)',
    color: '#ffffff',
    padding: '1rem 1.5rem',
    borderRadius: '12px',
    marginBottom: '1rem',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    animation: 'shake 0.5s ease-in-out',
    boxShadow: '0 4px 12px rgba(197, 48, 48, 0.3)',
    backdropFilter: 'blur(10px)',
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
    borderTop: '4px solid #ffffff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
  },
  loading: {
    textAlign: 'center' as const,
    padding: '1rem',
    fontSize: '1.2rem',
    color: '#ffffff',
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

  /* Button hover effects */
  button:hover {
    transform: translateY(-2px);
  }

  button[data-primary]:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4) !important;
  }

  button[data-danger]:hover {
    box-shadow: 0 6px 20px rgba(201, 75, 75, 0.4) !important;
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

  strong {
    color: #ffffff;
    font-weight: 600;
  }
`





