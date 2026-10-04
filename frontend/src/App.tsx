import React, { useState, useEffect, useRef } from 'react'
import {
  Hash,
  Plus,
  Send,
  BookOpen,
  Share2,
  ThumbsUp,
  ExternalLink,
  Compass,
  LogOut,
  LogIn,
  UserPlus,
  Edit3,
  Crown,
  Shield,
  GraduationCap,
  Trash2,
  UserMinus,
  Users,
  CheckCircle,
  AlertCircle,
  Info,
  Paperclip,
  FileText,
  File,
  X,
  Download,
  Film,
  Music,
  Smile,
  CornerUpLeft,
  Reply,
  Upload,
  Eye,
  Lock,
  Menu,
  MessageSquare,
} from 'lucide-react'
import { io, Socket } from 'socket.io-client'
import { supabase } from './lib/supabase'
import { apiFetch } from './lib/api'

interface User {
  id: number
  fullName: string
  username: string
  email: string
  avatarUrl: string
  domainInterests: string
  bio: string
  status?: string
}

interface Channel {
  id: number
  communityId: number
  name: string
  type: string
  topic: string
}

interface Community {
  id: number
  name: string
  slug: string
  description: string
  domainTag: string
  iconUrl: string
  isPrivate?: boolean
  ownerId?: number
  channels?: Channel[]
  members?: any[]
}

interface Message {
  id: number
  channelId: number
  userId: number
  content: string
  parentId?: number | null
  reactions?: string | null
  createdAt: string
  user?: User
}

interface Resource {
  id: number
  communityId?: number
  title: string
  url: string
  description: string
  domainTag: string
  upvotes: number
  createdAt: string
  user?: User
}

interface CommunityMember {
  id: number
  communityId: number
  userId: number
  role: 'owner' | 'admin' | 'member'
  user?: User
}

interface ToastInfo {
  id: number
  message: string
  type: 'error' | 'success' | 'info'
}

interface SavedAccount {
  email: string
  fullName: string
  avatarUrl?: string
  provider?: string
}

function extractUser(data: any): User | null {
  if (!data) return null
  let item = data
  if (item.transformerData && Array.isArray(item.transformerData) && item.transformerData[0]) {
    item = item.transformerData[0]
  }
  if (item.user) {
    const nested = extractUser(item.user)
    if (nested) return nested
  }
  if (item.data) {
    const nested = extractUser(item.data)
    if (nested) return nested
  }
  if (item.id && (item.fullName || item.email || item.username)) {
    return {
      id: Number(item.id),
      fullName: item.fullName || item.username || item.email?.split('@')[0] || 'Student',
      username: item.username || item.email?.split('@')[0] || 'student',
      email: item.email || '',
      avatarUrl: getAvatarUrl(item.avatarUrl, item.fullName || item.username || item.email),
      domainInterests: item.domainInterests || '',
      bio: item.bio || '',
      status: item.status || 'online',
    }
  }
  return null
}

interface AttachmentMeta {
  name: string
  type: string
  size: number
  url: string
}

const formatFileSize = (bytes?: number) => {
  if (!bytes || bytes <= 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const getFullUrl = (url?: string) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url
  }
  const envUrl = import.meta.env.VITE_API_URL
  const apiHost = envUrl
    ? envUrl.replace(/\/api\/v1\/?$/, '')
    : window.location.origin.includes(':5173')
      ? 'http://localhost:3333'
      : window.location.origin
  return `${apiHost}${url.startsWith('/') ? '' : '/'}${url}`
}

const getAvatarUrl = (avatarUrl?: string, nameOrSeed?: string) => {
  if (avatarUrl && avatarUrl.trim() !== '' && !avatarUrl.includes('api.dicebear.com')) {
    return getFullUrl(avatarUrl)
  }
  const name = (nameOrSeed || 'User').trim()
  const initials = name.includes(' ')
    ? `${name.split(' ')[0][0]}${name.split(' ')[1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase()

  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#06b6d4', '#3b82f6']
  const bg = colors[Math.abs(hash) % colors.length]

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="${bg}" rx="50%"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="40" font-weight="600" font-family="system-ui, sans-serif">${initials}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const CommunityServerIcon = ({ comm }: { comm: Community }) => {
  const [imgError, setImgError] = useState(false)
  const fullUrl = comm?.iconUrl ? getFullUrl(comm.iconUrl) : null

  useEffect(() => {
    setImgError(false)
  }, [comm?.iconUrl])

  if (fullUrl && !imgError) {
    return (
      <img
        src={fullUrl}
        alt={comm?.name || 'Community'}
        onError={() => setImgError(true)}
      />
    )
  }

  return <>{comm?.name ? comm.name.substring(0, 2).toUpperCase() : 'CC'}</>
}

const CommunityCardAvatar = ({ comm, size = 48 }: { comm: Community; size?: number }) => {
  const [imgError, setImgError] = useState(false)
  const fullUrl = comm?.iconUrl ? getFullUrl(comm.iconUrl) : null

  useEffect(() => {
    setImgError(false)
  }, [comm?.iconUrl])

  if (fullUrl && !imgError) {
    return (
      <img
        src={fullUrl}
        alt={comm?.name || 'Community'}
        onError={() => setImgError(true)}
        style={{ width: size, height: size, borderRadius: 12, objectFit: 'cover' }}
      />
    )
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: 16,
        flexShrink: 0,
      }}
    >
      {comm?.name ? comm.name.substring(0, 2).toUpperCase() : 'CC'}
    </div>
  )
}

const getHostname = (urlStr: string) => {
  try {
    const parsed = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return 'resource'
  }
}

const ResourceCard = ({
  res,
  onUpvote,
  onOpenDemo,
  onEdit,
  onDelete,
  currentUserId,
}: {
  res: Resource
  onUpvote: (id: number) => void
  onOpenDemo: (res: Resource) => void
  onEdit?: (res: Resource) => void
  onDelete?: (id: number) => void
  currentUserId?: number | string | null
}) => {
  const [imgError, setImgError] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  const hostname = getHostname(res.url)
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`
  const screenshotUrl = `https://image.thum.io/get/width/600/crop/400/noanimate/${encodeURIComponent(res.url)}`

  const isResourceOwner = Boolean(
    currentUserId &&
      (String(res.userId || res.user?.id) === String(currentUserId))
  )

  return (
    <div className="resource-card-modern">
      {/* Banner / Live Demo Thumbnail Header */}
      <div className="resource-banner-wrapper" onClick={() => onOpenDemo(res)}>
        {!imgError && (
          <img
            src={screenshotUrl}
            alt={res.title}
            className={`resource-banner-img ${imgLoaded ? 'loaded' : ''}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
        )}

        {(imgError || !imgLoaded) && (
          <div className="resource-banner-fallback">
            <div className="fallback-glow" />
            <ExternalLink size={26} color="var(--accent-primary)" style={{ opacity: 0.7 }} />
            <span className="fallback-host">{hostname}</span>
          </div>
        )}

        <div className="resource-banner-overlay">
          <div className="resource-host-pill">
            <img
              src={faviconUrl}
              alt={hostname}
              className="resource-favicon"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <span>{hostname}</span>
          </div>

          <div className="resource-demo-hover-badge">
            <Eye size={13} />
            <span>Live Demo</span>
          </div>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="resource-card-body">
        <div className="resource-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <a
            href={res.url}
            target="_blank"
            rel="noreferrer"
            className="resource-title-link"
            title={res.title}
            style={{ flex: 1 }}
          >
            {res.title}
          </a>
          {isResourceOwner && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {onEdit && (
                <button
                  type="button"
                  className="icon-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(res)
                  }}
                  title="Edit Resource"
                  style={{ padding: 4, color: '#a5b4fc' }}
                >
                  <Edit3 size={14} />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  className="icon-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(res.id)
                  }}
                  title="Delete Resource"
                  style={{ padding: 4, color: '#f87171' }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        <p className="resource-desc-text">
          {res.description || 'No detailed description provided for this resource.'}
        </p>

        <div className="resource-user-badge">
          <img
            src={getAvatarUrl(res.user?.avatarUrl, res.user?.fullName || res.user?.username)}
            alt={res.user?.fullName || 'Student'}
            className="resource-user-avatar"
          />
          <span className="resource-user-name">
            Shared by {res.user?.fullName || res.user?.username || 'Student'}
          </span>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="resource-card-footer">
        <span className="domain-badge">{res.domainTag || 'General'}</span>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="upvote-btn" onClick={() => onUpvote(res.id)} title="Upvote resource">
            <ThumbsUp size={13} />
            <span>{res.upvotes || 0} Upvotes</span>
          </button>

          <a
            href={res.url}
            target="_blank"
            rel="noreferrer"
            className="resource-open-link"
            title="Open external link"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  )
}


const renderFormattedContent = (content: string) => {
  if (!content) return null

  const attachmentRegex = /\[attachment:(\{.*?\})\]/g
  const attachments: AttachmentMeta[] = []

  const textWithoutAttachments = content
    .replace(attachmentRegex, (_, jsonStr) => {
      try {
        const parsed = JSON.parse(jsonStr)
        if (parsed && parsed.url) {
          attachments.push(parsed)
        }
      } catch (e) {
        console.error('Failed to parse attachment JSON:', e)
      }
      return ''
    })
    .trim()

  const renderTextWithLinks = (text: string) => {
    if (!text) return null
    const urlRegex = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi
    const parts = text.split(urlRegex)

    return parts.map((part, index) => {
      if (part.match(/^(https?:\/\/|www\.)/i)) {
        let cleanUrl = part
        let trailingPunct = ''
        const punctuationMatch = part.match(/([.,!?:;)]+)$/)
        if (punctuationMatch) {
          trailingPunct = punctuationMatch[0]
          cleanUrl = part.slice(0, -trailingPunct.length)
        }

        const href = cleanUrl.toLowerCase().startsWith('www.') ? `https://${cleanUrl}` : cleanUrl
        return (
          <React.Fragment key={index}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {cleanUrl}
            </a>
            {trailingPunct}
          </React.Fragment>
        )
      }
      return part
    })
  }

  return (
    <>
      {textWithoutAttachments && renderTextWithLinks(textWithoutAttachments)}
      {attachments.length > 0 && (
        <div className="chat-attachments-list">
          {attachments.map((att, idx) => {
            const fullUrl = getFullUrl(att.url)
            const isImage = att.type?.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(att.name)

            if (isImage) {
              return (
                <div key={idx} className="chat-attachment-card image-card">
                  <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="attachment-image-wrapper">
                    <img src={fullUrl} alt={att.name} className="attachment-image-preview" />
                  </a>
                  <div className="attachment-info-bar">
                    <span className="attachment-name" title={att.name}>{att.name}</span>
                    <span className="attachment-size">{formatFileSize(att.size)}</span>
                  </div>
                </div>
              )
            }

            return (
              <div key={idx} className="chat-attachment-card file-card">
                <div className="attachment-icon-box">
                  {att.type?.startsWith('audio/') ? (
                    <Music size={22} color="#a855f7" />
                  ) : att.type?.startsWith('video/') ? (
                    <Film size={22} color="#ec4899" />
                  ) : att.name.toLowerCase().endsWith('.pdf') ? (
                    <FileText size={22} color="#ef4444" />
                  ) : (
                    <File size={22} color="#818cf8" />
                  )}
                </div>
                <div className="attachment-details">
                  <span className="attachment-name" title={att.name}>{att.name}</span>
                  <span className="attachment-size">{formatFileSize(att.size)}</span>
                </div>
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={att.name}
                  className="attachment-download-btn"
                  title="Download file"
                >
                  <Download size={16} />
                </a>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

export default function App() {
  const [_authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('app_token'))
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem('app_user')
      return raw ? extractUser(JSON.parse(raw)) : null
    } catch {
      return null
    }
  })

  const updateUserSession = (user: User | null, token?: string) => {
    const validUser = extractUser(user)
    if (validUser) {
      localStorage.setItem('app_user', JSON.stringify(validUser))
      if (token) localStorage.setItem('app_token', token)
      setCurrentUser(validUser)
      if (token) setAuthToken(token)
    } else {
      localStorage.removeItem('app_user')
      localStorage.removeItem('app_token')
      setCurrentUser(null)
      setAuthToken(null)
    }
  }

  // Real accounts saved on this computer
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>(() => {
    try {
      const raw = localStorage.getItem('computer_saved_accounts')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  const saveAccountToComputer = (email: string, fullName: string, avatarUrl?: string, provider: string = 'google') => {
    setSavedAccounts((prev) => {
      const filtered = prev.filter((acc) => acc.email.toLowerCase() !== email.toLowerCase())
      const updated = [
        {
          email,
          fullName,
          avatarUrl: getAvatarUrl(avatarUrl, fullName || email),
          provider,
        },
        ...filtered,
      ]
      localStorage.setItem('computer_saved_accounts', JSON.stringify(updated))
      return updated
    })
  }

  const removeSavedAccountFromComputer = (email: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setSavedAccounts((prev) => {
      const updated = prev.filter((acc) => acc.email.toLowerCase() !== email.toLowerCase())
      localStorage.setItem('computer_saved_accounts', JSON.stringify(updated))
      return updated
    })
  }

  // Google Cloud OAuth Client ID configured in Supabase Dashboard
  const GOOGLE_CLIENT_ID = '149265235241-tshvumnres4rb0jdav3d5h4b78g05urc.apps.googleusercontent.com'
  const [googleClientId, setGoogleClientId] = useState<string>(() => localStorage.getItem('google_client_id') || GOOGLE_CLIENT_ID)

  const handleRedirectToGoogleOAuth = async (clientIdToUse?: string) => {
    const id = clientIdToUse || googleClientId || GOOGLE_CLIENT_ID
    if (id) {
      localStorage.setItem('google_client_id', id)
      const redirectUri = window.location.origin
      const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
        id.trim()
      )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(
        'openid email profile'
      )}`
      window.location.href = googleUrl
      return
    }

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  const [communities, setCommunities] = useState<Community[]>([])
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null)
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [resources, setResources] = useState<Resource[]>([])

  const [viewMode, setViewMode] = useState<'chat' | 'resources' | 'explore'>('chat')
  const [newMessageContent, setNewMessageContent] = useState('')
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string>('All')

  // Modals state
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showCreateCommunityModal, setShowCreateCommunityModal] = useState(false)
  const [showEditCommunityModal, setShowEditCommunityModal] = useState(false)
  const [showShareResourceModal, setShowShareResourceModal] = useState(false)
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [previewingResource, setPreviewingResource] = useState<Resource | null>(null)

  // OAuth Modal state
  const [showOAuthModal, setShowOAuthModal] = useState(false)
  const [showCustomOAuthForm, setShowCustomOAuthForm] = useState(false)
  const [oauthProvider] = useState<'google'>('google')
  const [oauthEmail, setOauthEmail] = useState('')
  const [oauthFullName, setOauthFullName] = useState('')

  // Auth form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [signupFullName, setSignupFullName] = useState('')
  const [signupUsername, setSignupUsername] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupDomains, setSignupDomains] = useState('Artificial Intelligence')
  const [customSignupDomains, setCustomSignupDomains] = useState('')

  // Profile edit state
  const [editFullName, setEditFullName] = useState('')
  const [editUsername, setEditUsername] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editAvatarUrl, setEditAvatarUrl] = useState('')
  const [editDomains, setEditDomains] = useState('')

  // Create & Edit forms state
  const [newCommName, setNewCommName] = useState('')
  const [newCommDomain, setNewCommDomain] = useState('Artificial Intelligence')
  const [customNewCommDomain, setCustomNewCommDomain] = useState('')
  const [newCommDesc, setNewCommDesc] = useState('')
  const [newCommIcon, setNewCommIcon] = useState('')
  const [newCommIsPrivate, setNewCommIsPrivate] = useState(false)

  const [editCommName, setEditCommName] = useState('')
  const [editCommDomain, setEditCommDomain] = useState('Artificial Intelligence')
  const [customEditCommDomain, setCustomEditCommDomain] = useState('')
  const [editCommDesc, setEditCommDesc] = useState('')
  const [editCommIcon, setEditCommIcon] = useState('')
  const [editCommIsPrivate, setEditCommIsPrivate] = useState(false)

  const [addMemberUsername, setAddMemberUsername] = useState('')
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [joinRequests, setJoinRequests] = useState<any[]>([])
  const [activeRosterTab, setActiveRosterTab] = useState<'members' | 'requests'>('members')
  const [userPendingJoinRequests, setUserPendingJoinRequests] = useState<Record<number, boolean>>({})

  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelTopic, setNewChannelTopic] = useState('')

  const [resTitle, setResTitle] = useState('')
  const [resUrl, setResUrl] = useState('')
  const [resDesc, setResDesc] = useState('')
  const [resDomain, setResDomain] = useState('Artificial Intelligence')
  const [customResDomain, setCustomResDomain] = useState('')

  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [editResTitle, setEditResTitle] = useState('')
  const [editResUrl, setEditResUrl] = useState('')
  const [editResDesc, setEditResDesc] = useState('')
  const [editResDomain, setEditResDomain] = useState('Artificial Intelligence')
  const [customEditResDomain, setCustomEditResDomain] = useState('')
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)

  const defaultDomains = [
    'Artificial Intelligence',
    'Web Development',
    'Cybersecurity',
    'Data Science',
    'Mobile Development',
  ]

  const availableDomains = Array.from(
    new Set([
      ...defaultDomains,
      ...communities.map((c) => c.domainTag).filter(Boolean),
      ...resources.map((r) => r.domainTag).filter(Boolean),
    ])
  )

  const [communityMembersList, setCommunityMembersList] = useState<CommunityMember[]>([])

  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [toasts, setToasts] = useState<ToastInfo[]>([])

  const socketRef = useRef<Socket | null>(null)
  const activeChannelRef = useRef<Channel | null>(null)
  const activeCommunityRef = useRef<Community | null>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  interface AttachmentItem {
    id: string
    file?: File
    name: string
    type: string
    size: number
    url?: string
    dataUrl?: string
  }

  const [attachedFiles, setAttachedFiles] = useState<AttachmentItem[]>([])
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false)
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null)
  const [activeReactionPickerMessageId, setActiveReactionPickerMessageId] = useState<number | null>(null)
  const [isUploadingCommIcon, setIsUploadingCommIcon] = useState(false)
  const createIconFileInputRef = useRef<HTMLInputElement>(null)
  const editIconFileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadCommunityIcon = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetModal: 'create' | 'edit'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingCommIcon(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await apiFetch<any>('/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok && res.data?.url) {
        const uploadedUrl = res.data.url
        if (targetModal === 'edit') {
          setEditCommIcon(uploadedUrl)
        } else {
          setNewCommIcon(uploadedUrl)
        }
        showToast('Community image uploaded successfully!', 'success')
      } else {
        const reader = new FileReader()
        reader.onload = (evt) => {
          const dataUrl = evt.target?.result as string
          if (dataUrl) {
            if (targetModal === 'edit') setEditCommIcon(dataUrl)
            else setNewCommIcon(dataUrl)
            showToast('Community image loaded locally.', 'info')
          }
        }
        reader.readAsDataURL(file)
      }
    } catch (err) {
      console.error('Icon upload error:', err)
      const reader = new FileReader()
      reader.onload = (evt) => {
        const dataUrl = evt.target?.result as string
        if (dataUrl) {
          if (targetModal === 'edit') setEditCommIcon(dataUrl)
          else setNewCommIcon(dataUrl)
          showToast('Community image loaded locally.', 'info')
        }
      }
      reader.readAsDataURL(file)
    } finally {
      setIsUploadingCommIcon(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newAttachments: AttachmentItem[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (evt) => resolve((evt.target?.result as string) || '')
        reader.readAsDataURL(file)
      })

      newAttachments.push({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
      })
    }

    setAttachedFiles((prev) => [...prev, ...newAttachments])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (id: string) => {
    setAttachedFiles((prev) => prev.filter((item) => item.id !== id))
  }

  useEffect(() => {
    activeChannelRef.current = activeChannel
  }, [activeChannel])

  useEffect(() => {
    activeCommunityRef.current = activeCommunity
  }, [activeCommunity])

  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }



  // 2. Initialize Socket.io connection and real-time event engine
  useEffect(() => {
    const envWsUrl = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL
    const wsTarget = envWsUrl
      ? envWsUrl.replace(/\/api\/v1\/?$/, '')
      : window.location.origin.includes(':5173')
        ? 'http://localhost:3333'
        : window.location.origin

    socketRef.current = io(wsTarget, {
      withCredentials: true,
    })

    // Real-time chat messages (scoped to active channel)
    socketRef.current.on('new_message', (message: Message) => {
      if (activeChannelRef.current && Number(message.channelId) === activeChannelRef.current.id) {
        setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]))
      }
    })

    socketRef.current.on('message_deleted', (data: { channelId: number | string; messageId: number | string }) => {
      if (activeChannelRef.current && Number(data.channelId) === activeChannelRef.current.id) {
        setMessages((prev) => prev.filter((m) => m.id !== Number(data.messageId)))
      }
    })

    socketRef.current.on('message_reacted', (data: { channelId: number | string; messageId: number | string; reactions: string | null }) => {
      if (activeChannelRef.current && Number(data.channelId) === activeChannelRef.current.id) {
        setMessages((prev) => prev.map((m) => (m.id === Number(data.messageId) ? { ...m, reactions: data.reactions } : m)))
      }
    })

    // Live typing indicators
    socketRef.current.on(
      'user_typing',
      (data: { channelId: string | number; username: string; isTyping: boolean }) => {
        if (activeChannelRef.current && Number(data.channelId) === activeChannelRef.current.id) {
          setTypingUsers((prev) => {
            if (data.isTyping) {
              return prev.includes(data.username) ? prev : [...prev, data.username]
            } else {
              return prev.filter((u) => u !== data.username)
            }
          })
        }
      }
    )

    // Channel events
    socketRef.current.on('channel_created', (channel: Channel) => {
      setActiveCommunity((prev) => {
        if (prev && prev.id === channel.communityId) {
          const currentChannels = prev.channels || []
          if (!currentChannels.some((c) => c.id === channel.id)) {
            return { ...prev, channels: [...currentChannels, channel] }
          }
        }
        return prev
      })
    })

    socketRef.current.on('channel_deleted', (data: { communityId: number; channelId: number }) => {
      setActiveCommunity((prev) => {
        if (prev && prev.id === data.communityId) {
          const filtered = (prev.channels || []).filter((c) => c.id !== data.channelId)
          return { ...prev, channels: filtered }
        }
        return prev
      })
      if (activeChannelRef.current && activeChannelRef.current.id === data.channelId) {
        setActiveChannel(null)
        setMessages([])
      }
    })

    // Community events
    socketRef.current.on('community_updated', (updated: Community) => {
      setCommunities((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)))
      setActiveCommunity((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev))
    })

    socketRef.current.on('community_deleted', (data: { communityId: number }) => {
      setCommunities((prev) => prev.filter((c) => c.id !== data.communityId))
      if (activeCommunityRef.current && activeCommunityRef.current.id === data.communityId) {
        setActiveCommunity(null)
        setActiveChannel(null)
        setMessages([])
        setViewMode('explore')
        showToast('The current community server was deleted by its owner.', 'info')
      }
    })

    // Member events
    socketRef.current.on('member_joined', (data: { communityId: number; member: CommunityMember }) => {
      if (activeCommunityRef.current && activeCommunityRef.current.id === data.communityId) {
        setCommunityMembersList((prev) => {
          if (prev.some((m) => m.userId === data.member.userId)) return prev
          return [...prev, data.member]
        })
      }
    })

    socketRef.current.on('member_left', (data: { communityId: number; userId: number }) => {
      if (activeCommunityRef.current && activeCommunityRef.current.id === data.communityId) {
        setCommunityMembersList((prev) =>
          prev.filter((m) => m.userId !== data.userId && m.user?.id !== data.userId)
        )
      }
    })

    socketRef.current.on('member_role_updated', (data: { communityId: number; member: CommunityMember }) => {
      if (activeCommunityRef.current && activeCommunityRef.current.id === data.communityId) {
        setCommunityMembersList((prev) =>
          prev.map((m) => (m.id === data.member.id ? { ...m, ...data.member } : m))
        )
      }
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [])

  const fetchCommunities = async () => {
    try {
      const res = await apiFetch<Community[]>('/communities')
      if (res.ok && res.data) {
        setCommunities(res.data)
      }
    } catch (err) {
      console.error('Fetch communities error:', err)
    }
  }

  const selectChannel = async (channel: Channel) => {
    if (activeChannelRef.current && socketRef.current) {
      socketRef.current.emit('leave_channel', activeChannelRef.current.id)
    }

    setActiveChannel(channel)
    setTypingUsers([])

    if (socketRef.current) {
      socketRef.current.emit('join_channel', channel.id)
    }

    try {
      const res = await apiFetch<Message[]>(`/channels/${channel.id}/messages`)
      if (res.ok && res.data) {
        setMessages(res.data)
      } else {
        setMessages([])
      }
    } catch (err) {
      console.error('Fetch messages error:', err)
    }
  }

  const fetchCommunityMembers = async (commId: number) => {
    try {
      const res = await apiFetch<CommunityMember[]>(`/communities/${commId}/members`)
      if (res.ok && res.data) {
        setCommunityMembersList(res.data)
      }
    } catch (err) {
      console.error('Fetch community members error:', err)
    }
  }

  const fetchCommunityDetails = async (id: number) => {
    try {
      if (activeCommunityRef.current && socketRef.current) {
        socketRef.current.emit('leave_community', activeCommunityRef.current.id)
      }

      const res = await apiFetch<Community>(`/communities/${id}`)
      if (res.ok && res.data) {
        const data = res.data
        setActiveCommunity(data)

        if (socketRef.current) {
          socketRef.current.emit('join_community', data.id)
        }

        if (data.channels && data.channels.length > 0) {
          selectChannel(data.channels[0])
        } else {
          setActiveChannel(null)
          setMessages([])
        }
        fetchCommunityMembers(data.id)
      }
    } catch (err) {
      console.error('Fetch community details error:', err)
    }
  }

  const fetchResources = async (domain: string) => {
    try {
      const endpoint = domain === 'All' ? '/resources' : `/resources?domain=${encodeURIComponent(domain)}`
      const res = await apiFetch<Resource[]>(endpoint)
      if (res.ok && res.data) {
        setResources(res.data)
      }
    } catch (err) {
      console.error('Fetch resources error:', err)
    }
  }

  // 3. Fetch Initial Data (Fast & Parallel)
  useEffect(() => {
    let isCancelled = false
    const loadInitialData = async () => {
      try {
        const [commRes, resRes] = await Promise.all([
          apiFetch<Community[]>('/communities'),
          apiFetch<Resource[]>('/resources'),
        ])

        if (!isCancelled) {
          if (commRes.ok && commRes.data) {
            setCommunities(commRes.data)
            if (commRes.data.length > 0) {
              fetchCommunityDetails(commRes.data[0].id)
            }
          }
          if (resRes.ok && resRes.data) {
            setResources(resRes.data)
          }
        }
      } catch (err) {
        console.error('Error loading initial data:', err)
      }
    }

    loadInitialData()
    return () => {
      isCancelled = true
    }
  }, [])

  // Helper: Sync Supabase Session with backend
  const syncSupabaseSession = async (session: any) => {
    const user = session?.user
    if (!user || !user.email) return
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.fullName ||
      user.user_metadata?.name ||
      user.email.split('@')[0]
    const avatarUrl =
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      getAvatarUrl(undefined, user.email)

    try {
      const syncRes = await apiFetch<any>('/auth/oauth', {
        method: 'POST',
        body: JSON.stringify({
          email: user.email,
          fullName,
          avatarUrl,
          provider: 'google',
        }),
      })

      if (syncRes.ok && syncRes.data) {
        const token = syncRes.data.token || syncRes.data.data?.token
        const profile = extractUser(syncRes.data)
        if (profile) {
          updateUserSession(profile, token)
          saveAccountToComputer(user.email, profile.fullName || fullName, profile.avatarUrl || avatarUrl, 'google')
        }
      }
    } catch (err) {
      console.error('Sync Supabase session error:', err)
    }
  }

function parseJwtPayload(token: string): any {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

  // Unified Auth Session Initializer (handles OAuth return hashes, Supabase session, & local app_token)
  useEffect(() => {
    let isSubscribed = true

    const initAuthSession = async () => {
      try {
        // 1. Process URL hash callback (#access_token=... or #id_token=...) if returning from Google/Supabase OAuth
        const hash = window.location.hash
        if (hash && (hash.includes('access_token=') || hash.includes('id_token='))) {
          const params = new URLSearchParams(hash.substring(1))
          const accessToken = params.get('access_token') || params.get('id_token')
          const refreshToken = params.get('refresh_token')

          if (accessToken) {
            if (refreshToken) {
              await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).catch(() => null)
            }

            let userEmail: string | null = null
            let userFullName: string | null = null
            let userAvatarUrl: string | null = null

            // Method A: Ask Supabase client SDK
            try {
              const { data: { user } } = await supabase.auth.getUser(accessToken)
              if (user && user.email) {
                userEmail = user.email
                userFullName =
                  user.user_metadata?.full_name ||
                  user.user_metadata?.fullName ||
                  user.user_metadata?.name ||
                  user.email.split('@')[0]
                userAvatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture
              }
            } catch (e) {
              console.warn('Supabase getUser error:', e)
            }

            // Method B: Direct JWT base64 payload decoding (Fallback)
            if (!userEmail) {
              const jwt = parseJwtPayload(accessToken)
              if (jwt) {
                userEmail = jwt.email || jwt.user_metadata?.email || jwt.claims?.email || null
                userFullName =
                  jwt.user_metadata?.full_name ||
                  jwt.user_metadata?.fullName ||
                  jwt.user_metadata?.name ||
                  jwt.name ||
                  jwt.full_name ||
                  (userEmail ? userEmail.split('@')[0] : null)
                userAvatarUrl = jwt.user_metadata?.avatar_url || jwt.user_metadata?.picture || jwt.picture || null
              }
            }

            if (userEmail) {
              const res = await apiFetch<any>('/auth/oauth', {
                method: 'POST',
                body: JSON.stringify({
                  email: userEmail,
                  fullName: userFullName || userEmail.split('@')[0],
                  avatarUrl: userAvatarUrl,
                  provider: 'google',
                }),
              })

              if (res.ok && res.data) {
                const token = res.data.token || res.data.data?.token
                const profile = extractUser(res.data)
                if (profile) {
                  updateUserSession(profile, token)
                  saveAccountToComputer(userEmail, profile.fullName, profile.avatarUrl, 'google')
                  if (isSubscribed) {
                    showToast(`Signed in as ${profile.fullName}`, 'success')
                  }
                  window.history.replaceState(null, '', window.location.pathname)
                  return
                }
              }
            }
            window.history.replaceState(null, '', window.location.pathname)
          }
        }

        // 2. Check existing app_token in localStorage first (Instant local check)
        const storedToken = localStorage.getItem('app_token')
        if (storedToken) {
          const res = await apiFetch<any>('/account/profile')
          if (res.ok && res.data) {
            const profile = extractUser(res.data)
            if (profile && isSubscribed) {
              updateUserSession(profile, storedToken)
              return
            }
          }
        }

        // 3. Check active Supabase session (with 1.5s max timeout)
        try {
          const supabaseSessionPromise = supabase.auth.getSession()
          const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
            setTimeout(() => resolve({ data: { session: null } }), 1500)
          )
          const { data: { session } } = await Promise.race([supabaseSessionPromise, timeoutPromise])
          if (session?.user) {
            await syncSupabaseSession(session)
            return
          }
        } catch (e) {
          console.warn('Supabase session fetch timed out or failed:', e)
        }

        // 4. Fallback check: If app_user exists in localStorage and is valid
        const cachedUserRaw = localStorage.getItem('app_user')
        if (cachedUserRaw && storedToken) {
          try {
            const cachedUser = extractUser(JSON.parse(cachedUserRaw))
            if (cachedUser && isSubscribed) {
              setCurrentUser(cachedUser)
              setAuthToken(storedToken)
              return
            }
          } catch {}
        }

        // 5. No valid session found
        if (isSubscribed && !localStorage.getItem('app_token')) {
          updateUserSession(null)
        }
      } catch (err) {
        console.error('Auth init error:', err)
      }
    }

    initAuthSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user && isSubscribed) {
        await syncSupabaseSession(session)
      }
    })

    return () => {
      isSubscribed = false
      subscription.unsubscribe()
    }
  }, [])

  // SUPABASE AUTH ACTIONS
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // 1. Try local backend authentication first (~10ms)
      const res = await apiFetch<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })

      if (res.ok && res.data) {
        const token = res.data.token || res.data.data?.token
        const user = extractUser(res.data)
        if (user) {
          updateUserSession(user, token)
          setShowLoginModal(false)
          setLoginEmail('')
          setLoginPassword('')
          showToast(`Welcome back, ${user.fullName}!`, 'success')
          return
        }
      }

      // 2. Fallback to Supabase Auth with a 1.5s timeout race
      try {
        const supabaseLoginPromise = supabase.auth.signInWithPassword({
          email: loginEmail,
          password: loginPassword,
        })
        const timeoutPromise = new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error('Supabase login timeout')), 1500)
        )
        const { data, error } = await Promise.race([supabaseLoginPromise, timeoutPromise])

        if (!error && data?.session) {
          await syncSupabaseSession(data.session)
          setShowLoginModal(false)
          setLoginEmail('')
          setLoginPassword('')
          showToast('Logged in via Supabase Auth!', 'success')
          return
        }
      } catch {}

      showToast(res.error || 'Invalid email or password.', 'error')
    } catch (err) {
      console.error('Login error:', err)
      showToast('Login failed. Please check your credentials.', 'error')
    }
  }

  const handleDirectAccountLogin = async (email: string, fullName: string) => {
    try {
      const res = await apiFetch<any>('/auth/oauth', {
        method: 'POST',
        body: JSON.stringify({
          email,
          fullName,
          provider: oauthProvider,
        }),
      })

      if (res.ok && res.data) {
        const token = res.data.token || res.data.data?.token
        const user = extractUser(res.data)
        if (user) {
          updateUserSession(user, token)
          saveAccountToComputer(user.email, user.fullName, user.avatarUrl, oauthProvider)
          setShowOAuthModal(false)
          setShowLoginModal(false)
          setShowSignupModal(false)
          showToast(`Signed in as ${user.fullName}`, 'success')
        } else {
          showToast(res.error || 'OAuth authorization failed.', 'error')
        }
      } else {
        showToast(res.error || 'OAuth authorization failed.', 'error')
      }
    } catch (err) {
      console.error('OAuth direct login error:', err)
      showToast('OAuth login error.', 'error')
    }
  }

  const handleExecuteOAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!oauthEmail.trim()) return

    try {
      const res = await apiFetch<any>('/auth/oauth', {
        method: 'POST',
        body: JSON.stringify({
          email: oauthEmail,
          fullName: oauthFullName || oauthEmail.split('@')[0],
          provider: oauthProvider,
        }),
      })

      if (res.ok && res.data) {
        const token = res.data.token || res.data.data?.token
        const user = extractUser(res.data)
        if (user) {
          updateUserSession(user, token)
          saveAccountToComputer(user.email, user.fullName, user.avatarUrl, oauthProvider)
          setShowOAuthModal(false)
          setShowLoginModal(false)
          setShowSignupModal(false)
          showToast(`Signed in as ${user.fullName}`, 'success')
        } else {
          showToast(res.error || 'OAuth authorization failed.', 'error')
        }
      } else {
        showToast(res.error || 'OAuth authorization failed.', 'error')
      }
    } catch (err) {
      console.error('OAuth error:', err)
      showToast('OAuth login error.', 'error')
    }
  }

  const handleOAuthLogin = async (_provider?: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
      if (!error && data?.url) {
        window.location.href = data.url
        return
      }
    } catch {
      // Fallback to direct Google OAuth URL
    }

    const redirectUri = window.location.origin
    const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      GOOGLE_CLIENT_ID
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(
      'openid email profile'
    )}`
    window.location.href = googleUrl
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            fullName: signupFullName,
            username: signupUsername,
            domainInterests: signupDomains,
          },
        },
      })

      // Also create profile record in Adonis backend DB
      const syncRes = await apiFetch<any>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          fullName: signupFullName,
          username: signupUsername,
          email: signupEmail,
          password: signupPassword,
          domainInterests: signupDomains,
        }),
      })

      if (error && !syncRes.ok) {
        showToast(error.message || syncRes.error || 'Signup failed.', 'error')
        return
      }

      if (data.session) {
        await syncSupabaseSession(data.session)
      } else if (syncRes.ok && syncRes.data) {
        const token = syncRes.data.token || syncRes.data.data?.token
        const user = extractUser(syncRes.data)
        if (user) {
          updateUserSession(user, token)
        }
      }

      setShowSignupModal(false)
      setSignupFullName('')
      setSignupUsername('')
      setSignupEmail('')
      setSignupPassword('')
      showToast('Student account created via Supabase Auth!', 'success')
    } catch (err) {
      console.error('Supabase Signup error:', err)
      showToast('Signup error occurred.', 'error')
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch {}
    try {
      await apiFetch('/account/logout', { method: 'POST' }).catch(() => null)
    } catch {}
    updateUserSession(null)
    showToast('Logged out successfully.', 'info')
  }

  // PROFILE UPDATE ACTION
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await apiFetch<any>('/account/profile', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: editFullName,
          username: editUsername,
          bio: editBio,
          avatarUrl: editAvatarUrl,
          domainInterests: editDomains,
        }),
      })

      if (res.ok && res.data) {
        setCurrentUser(res.data.data || res.data)
        setShowProfileModal(false)
        showToast('Profile updated successfully!', 'success')
      } else {
        showToast(res.error || 'Failed to update profile.', 'error')
      }
    } catch (err) {
      console.error('Profile update error:', err)
      showToast('Error updating profile.', 'error')
    }
  }

  const openProfileEdit = () => {
    if (currentUser) {
      setEditFullName(currentUser.fullName || '')
      setEditUsername(currentUser.username || '')
      setEditBio(currentUser.bio || '')
      setEditAvatarUrl(currentUser.avatarUrl || '')
      setEditDomains(currentUser.domainInterests || '')
      setShowProfileModal(true)
    }
  }

  // ROLE-BASED COMMUNITY MANAGEMENT
  const handleDeleteCommunity = async (commId: number) => {
    if (!confirm('Are you sure you want to permanently delete this student community server? All channels and messages will be removed.')) return

    try {
      const res = await apiFetch(`/communities/${commId}`, {
        method: 'DELETE',
        onForbidden: (msg) => showToast(msg, 'error'),
      })
      if (res.ok) {
        showToast('Community server deleted.', 'info')
        await fetchCommunities()
        setActiveCommunity(null)
        setActiveChannel(null)
        setViewMode('explore')
      } else {
        showToast(res.error || 'Only the Community Owner can delete this server.', 'error')
      }
    } catch (err) {
      console.error('Delete community error:', err)
    }
  }

  const handleUpdateCommunity = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalDomain = editCommDomain === 'Other' ? customEditCommDomain.trim() : editCommDomain
    if (!activeCommunity || !editCommName.trim() || !finalDomain) {
      showToast('Please provide a community name and domain tag.', 'error')
      return
    }

    try {
      const res = await apiFetch<Community>(`/communities/${activeCommunity.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editCommName,
          title: editCommName,
          domainTag: finalDomain,
          description: editCommDesc,
          iconUrl: editCommIcon,
          avatarUrl: editCommIcon,
          isPrivate: editCommIsPrivate,
        }),
        onForbidden: (msg) => showToast(msg, 'error'),
      })

      if (res.ok && res.data) {
        setActiveCommunity(res.data)
        setShowEditCommunityModal(false)
        setCustomEditCommDomain('')
        showToast('Community server details updated.', 'success')
        await fetchCommunities()
      } else {
        showToast(res.error || 'Only Community Owner can update server details.', 'error')
      }
    } catch (err) {
      console.error('Update community error:', err)
      showToast('Error updating server details.', 'error')
    }
  }

  const openEditCommunityModal = () => {
    if (activeCommunity) {
      setEditCommName(activeCommunity.name || '')
      const currentTag = activeCommunity.domainTag || 'Artificial Intelligence'
      if (availableDomains.includes(currentTag)) {
        setEditCommDomain(currentTag)
        setCustomEditCommDomain('')
      } else {
        setEditCommDomain('Other')
        setCustomEditCommDomain(currentTag)
      }
      setEditCommDesc(activeCommunity.description || '')
      setEditCommIcon(activeCommunity.iconUrl || '')
      setEditCommIsPrivate(Boolean(activeCommunity.isPrivate))
      setShowEditCommunityModal(true)
    }
  }

  const fetchJoinRequests = async (commId: number) => {
    try {
      const res = await apiFetch<any[]>(`/communities/${commId}/join-requests`)
      if (res.ok && res.data) {
        setJoinRequests(res.data)
      }
    } catch (err) {
      console.error('Error fetching join requests:', err)
    }
  }

  const handleCreateJoinRequest = async (commId: number) => {
    if (!currentUser) {
      setShowLoginModal(true)
      return
    }

    try {
      const res = await apiFetch<any>(`/communities/${commId}/join-request`, {
        method: 'POST',
      })

      if (res.ok && res.data) {
        if (res.data.status === 'joined') {
          showToast('Joined community server successfully!', 'success')
          await fetchCommunityDetails(commId)
          await fetchCommunities()
          setViewMode('chat')
        } else {
          setUserPendingJoinRequests((prev) => ({ ...prev, [commId]: true }))
          showToast(res.data.message || 'Join request submitted! Awaiting owner/admin approval.', 'info')
        }
      } else {
        showToast(res.error || 'Failed to submit join request.', 'error')
      }
    } catch (err) {
      console.error('Error requesting to join:', err)
      showToast('Error requesting to join community.', 'error')
    }
  }

  const handleRespondJoinRequest = async (requestId: number, action: 'approve' | 'reject') => {
    if (!activeCommunity) return

    try {
      const res = await apiFetch<any>(`/communities/${activeCommunity.id}/join-requests/${requestId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      })

      if (res.ok) {
        showToast(res.data?.message || `Request ${action}d.`, 'success')
        await fetchJoinRequests(activeCommunity.id)
        await fetchCommunityMembers(activeCommunity.id)
      } else {
        showToast(res.error || 'Failed to respond to request.', 'error')
      }
    } catch (err) {
      console.error('Error responding to join request:', err)
      showToast('Error responding to request.', 'error')
    }
  }

  const handleAddMemberByUsername = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeCommunity || !addMemberUsername.trim()) return

    setIsAddingMember(true)
    try {
      const res = await apiFetch<any>(`/communities/${activeCommunity.id}/add-member`, {
        method: 'POST',
        body: JSON.stringify({ username: addMemberUsername.trim() }),
      })

      if (res.ok && res.data) {
        showToast(res.data.message || 'User added to server!', 'success')
        setAddMemberUsername('')
        await fetchCommunityMembers(activeCommunity.id)
      } else {
        showToast(res.error || 'Failed to add user to server.', 'error')
      }
    } catch (err) {
      console.error('Error adding member:', err)
      showToast('Error adding member.', 'error')
    } finally {
      setIsAddingMember(false)
    }
  }

  const handleJoinCommunity = async (commId: number) => {
    if (!currentUser) {
      setShowLoginModal(true)
      return
    }

    try {
      const res = await apiFetch(`/communities/${commId}/join`, {
        method: 'POST',
      })
      if (res.ok) {
        showToast('Successfully joined community server!', 'success')
        await fetchCommunityDetails(commId)
        await fetchCommunities()
        setViewMode('chat')
      } else {
        showToast(res.error || 'Failed to join community.', 'error')
      }
    } catch (err) {
      console.error('Join community error:', err)
      showToast('Error joining community.', 'error')
    }
  }

  const handleLeaveCommunity = async (commId: number) => {
    try {
      const res = await apiFetch(`/communities/${commId}/leave`, {
        method: 'POST',
      })
      if (res.ok) {
        showToast('Successfully left the community server.', 'info')
        await fetchCommunities()
        setActiveCommunity(null)
        setActiveChannel(null)
        setViewMode('explore')
      } else {
        showToast(res.error || 'Error leaving community', 'error')
      }
    } catch (err) {
      console.error('Leave community error:', err)
    }
  }

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeCommunity || !newChannelName.trim()) return

    try {
      const res = await apiFetch(`/communities/${activeCommunity.id}/channels`, {
        method: 'POST',
        body: JSON.stringify({
          name: newChannelName,
          topic: newChannelTopic,
          type: 'text',
        }),
        onForbidden: (msg) => showToast(msg, 'error'),
      })
      if (res.ok) {
        setShowCreateChannelModal(false)
        setNewChannelName('')
        setNewChannelTopic('')
        showToast('Channel created successfully!', 'success')
        await fetchCommunityDetails(activeCommunity.id)
      } else {
        showToast(res.error || 'Only Community Owner can create channels.', 'error')
      }
    } catch (err) {
      console.error('Create channel error:', err)
    }
  }

  const handleDeleteChannel = async (chId: number) => {
    if (!confirm('Are you sure you want to delete this channel?')) return

    try {
      const res = await apiFetch(`/channels/${chId}`, {
        method: 'DELETE',
        onForbidden: (msg) => showToast(msg, 'error'),
      })
      if (res.ok && activeCommunity) {
        showToast('Channel deleted.', 'info')
        await fetchCommunityDetails(activeCommunity.id)
      } else {
        showToast(res.error || 'Only Community Owner can delete channels.', 'error')
      }
    } catch (err) {
      console.error('Delete channel error:', err)
    }
  }

  const handleKickMember = async (memberUserId: number) => {
    if (!activeCommunity) return
    try {
      const res = await apiFetch(`/communities/${activeCommunity.id}/members/${memberUserId}`, {
        method: 'DELETE',
        onForbidden: (msg) => showToast(msg, 'error'),
      })
      if (res.ok) {
        showToast('Member removed from server.', 'info')
        await fetchCommunityMembers(activeCommunity.id)
      } else {
        showToast(res.error || 'Only Community Owner can remove members.', 'error')
      }
    } catch (err) {
      console.error('Kick member error:', err)
    }
  }

  const handleUpdateMemberRole = async (memberUserId: number, role: 'admin' | 'member') => {
    if (!activeCommunity) return
    try {
      const res = await apiFetch(`/communities/${activeCommunity.id}/members/${memberUserId}`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
        onForbidden: (msg) => showToast(msg, 'error'),
      })
      if (res.ok) {
        showToast(`Member role updated to ${role}.`, 'success')
        await fetchCommunityMembers(activeCommunity.id)
      } else {
        showToast(res.error || 'Only Community Owner can change member roles.', 'error')
      }
    } catch (err) {
      console.error('Update member role error:', err)
    }
  }

  // CHAT INPUT & LIVE TYPING ACTIONS
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewMessageContent(e.target.value)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`
    }

    if (!activeChannel || !socketRef.current || !currentUser) return

    // Emit live typing start
    socketRef.current.emit('typing_start', {
      channelId: activeChannel.id,
      username: currentUser.fullName || currentUser.username || 'Student',
    })

    // Debounce typing_stop after 2.5 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing_stop', {
        channelId: activeChannel.id,
        username: currentUser.fullName || currentUser.username || 'Student',
      })
    }, 2500)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  const handleToggleReaction = async (messageId: number, emoji: string) => {
    setActiveReactionPickerMessageId(null)
    if (!isMember) {
      showToast('You must join this community server to react to messages.', 'error')
      return
    }
    try {
      const res = await apiFetch<{ reactions: string | null }>(`/messages/${messageId}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      })
      if (res.ok && res.data) {
        const reactionsData = res.data.reactions
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, reactions: reactionsData } : m))
        )
      } else {
        showToast(res.error || 'Failed to react to message.', 'error')
      }
    } catch (err) {
      console.error('Reaction error:', err)
    }
  }

  const handleDeleteMessage = async (messageId: number) => {
    try {
      const res = await apiFetch<{ messageId: number }>(`/messages/${messageId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId))
        showToast('Message deleted.', 'info')
      } else {
        showToast(res.error || 'Failed to delete message.', 'error')
      }
    } catch (err) {
      console.error('Delete message error:', err)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!newMessageContent.trim() && attachedFiles.length === 0) || !activeChannel) return

    if (!currentUser) {
      setShowLoginModal(true)
      return
    }

    if (!isMember) {
      showToast('You must join this community server to send messages.', 'error')
      return
    }

    // Clear typing indicator immediately on send
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    if (socketRef.current) {
      socketRef.current.emit('typing_stop', {
        channelId: activeChannel.id,
        username: currentUser.fullName || currentUser.username || 'Student',
      })
    }

    const uploadedAttachments: Array<{ name: string; type: string; size: number; url: string }> = []

    if (attachedFiles.length > 0) {
      setIsUploadingAttachment(true)
      for (const att of attachedFiles) {
        try {
          if (att.file) {
            const formData = new FormData()
            formData.append('file', att.file)
            const res = await apiFetch<any>('/upload', {
              method: 'POST',
              body: formData,
            })
            if (res.ok && res.data?.url) {
              uploadedAttachments.push({
                name: att.name,
                type: att.type,
                size: att.size,
                url: res.data.url,
              })
            } else if (att.dataUrl) {
              uploadedAttachments.push({
                name: att.name,
                type: att.type,
                size: att.size,
                url: att.dataUrl,
              })
            }
          } else if (att.url || att.dataUrl) {
            uploadedAttachments.push({
              name: att.name,
              type: att.type,
              size: att.size,
              url: att.url || att.dataUrl!,
            })
          }
        } catch (err) {
          console.error('File upload error:', err)
          if (att.dataUrl) {
            uploadedAttachments.push({
              name: att.name,
              type: att.type,
              size: att.size,
              url: att.dataUrl,
            })
          }
        }
      }
      setIsUploadingAttachment(false)
    }

    let contentToSend = newMessageContent.trim()
    if (uploadedAttachments.length > 0) {
      const attachmentTags = uploadedAttachments
        .map((att) => `[attachment:${JSON.stringify(att)}]`)
        .join('\n')
      contentToSend = contentToSend ? `${contentToSend}\n${attachmentTags}` : attachmentTags
    }

    setNewMessageContent('')
    setAttachedFiles([])
    const parentIdToSend = replyingToMessage ? replyingToMessage.id : null
    setReplyingToMessage(null)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      const res = await apiFetch<Message>(`/channels/${activeChannel.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: contentToSend, parentId: parentIdToSend }),
      })

      if (res.ok && res.data) {
        const msg = res.data
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
      } else {
        showToast(res.error || 'Failed to send message.', 'error')
      }
    } catch (err) {
      console.error('Error sending message:', err)
      showToast('Message send error.', 'error')
    }
  }

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalDomain = newCommDomain === 'Other' ? customNewCommDomain.trim() : newCommDomain
    if (!newCommName.trim() || !finalDomain) {
      showToast('Please provide a community name and domain tag.', 'error')
      return
    }

    if (!currentUser) {
      setShowLoginModal(true)
      return
    }

    try {
      const res = await apiFetch<Community>('/communities', {
        method: 'POST',
        body: JSON.stringify({
          name: newCommName,
          domainTag: finalDomain,
          description: newCommDesc,
          iconUrl: newCommIcon || undefined,
          isPrivate: newCommIsPrivate,
        }),
      })

      if (res.ok && res.data) {
        const created = res.data
        setShowCreateCommunityModal(false)
        setNewCommName('')
        setNewCommDesc('')
        setNewCommIcon('')
        setNewCommIsPrivate(false)
        setCustomNewCommDomain('')
        setNewCommDomain('Artificial Intelligence')
        showToast('Community server created successfully!', 'success')
        await fetchCommunities()
        await fetchCommunityDetails(created.id)
        setViewMode('chat')
      } else {
        showToast(res.error || 'Failed to create community.', 'error')
      }
    } catch (err) {
      console.error('Error creating community:', err)
      showToast('Error creating community.', 'error')
    }
  }

  const handleShareResource = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalDomain = resDomain === 'Other' ? customResDomain.trim() : resDomain
    if (!resTitle.trim() || !resUrl.trim() || !finalDomain) {
      showToast('Please provide a title, URL, and domain category.', 'error')
      return
    }

    if (!currentUser) {
      setShowLoginModal(true)
      return
    }

    try {
      const res = await apiFetch<Resource>('/resources', {
        method: 'POST',
        body: JSON.stringify({
          title: resTitle,
          url: resUrl,
          description: resDesc,
          domainTag: finalDomain,
          communityId: activeCommunity?.id,
        }),
      })

      if (res.ok) {
        setShowShareResourceModal(false)
        setResTitle('')
        setResUrl('')
        setResDesc('')
        setCustomResDomain('')
        setResDomain('Artificial Intelligence')
        showToast('Resource shared successfully!', 'success')
        fetchResources(selectedDomainFilter)
      } else {
        showToast(res.error || 'Failed to share resource.', 'error')
      }
    } catch (err) {
      console.error('Error sharing resource:', err)
      showToast('Error sharing resource.', 'error')
    }
  }

  const handleUpvote = async (id: number) => {
    try {
      const res = await apiFetch<Resource>(`/resources/${id}/upvote`, { method: 'POST' })
      if (res.ok && res.data) {
        const updated = res.data
        setResources((prev) => prev.map((r) => (r.id === id ? updated : r)))
      }
    } catch (err) {
      console.error('Error upvoting resource:', err)
    }
  }

  const handleOpenEditResourceModal = (res: Resource) => {
    setEditingResource(res)
    setEditResTitle(res.title || '')
    setEditResUrl(res.url || '')
    setEditResDesc(res.description || '')
    if (availableDomains.includes(res.domainTag)) {
      setEditResDomain(res.domainTag)
      setCustomEditResDomain('')
    } else {
      setEditResDomain('Other')
      setCustomEditResDomain(res.domainTag)
    }
  }

  const handleUpdateResource = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingResource) return
    const finalDomain = editResDomain === 'Other' ? customEditResDomain.trim() : editResDomain
    if (!editResTitle.trim() || !editResUrl.trim() || !finalDomain) {
      showToast('Title, URL, and Domain Tag are required.', 'error')
      return
    }

    try {
      const res = await apiFetch<Resource>(`/resources/${editingResource.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editResTitle,
          url: editResUrl,
          description: editResDesc,
          domainTag: finalDomain,
        }),
      })

      if (res.ok && res.data) {
        showToast('Resource updated successfully!', 'success')
        setResources((prev) => prev.map((r) => (r.id === editingResource.id ? res.data! : r)))
        setEditingResource(null)
      } else {
        showToast(res.error || 'Failed to update resource.', 'error')
      }
    } catch (err) {
      console.error('Update resource error:', err)
      showToast('Error updating resource.', 'error')
    }
  }

  const handleDeleteResource = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return

    try {
      const res = await apiFetch(`/resources/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        showToast('Resource deleted successfully.', 'info')
        setResources((prev) => prev.filter((r) => r.id !== id))
      } else {
        showToast(res.error || 'Failed to delete resource.', 'error')
      }
    } catch (err) {
      console.error('Delete resource error:', err)
      showToast('Error deleting resource.', 'error')
    }
  }

  const isSameUser = (id1?: number | string | null, id2?: number | string | null) => {
    if (id1 === undefined || id1 === null || id2 === undefined || id2 === null) return false
    return String(id1) === String(id2)
  }

  const isOwner = Boolean(currentUser && activeCommunity && isSameUser(activeCommunity.ownerId, currentUser.id))
  const isMember = Boolean(
    currentUser &&
      (isOwner ||
        communityMembersList.some(
          (m) => isSameUser(m.userId || m.user?.id, currentUser.id)
        ))
  )

  const joinedCommunities = communities.filter((comm) => {
    if (!currentUser) return false
    if (isSameUser(comm.ownerId, currentUser.id)) return true
    return comm.members?.some(
      (m: any) => isSameUser(m.userId || m.user?.id, currentUser.id)
    )
  })

  const activeUserRole: 'owner' | 'admin' | 'member' | null = isOwner
    ? 'owner'
    : communityMembersList.find((m) => isSameUser(m.userId || m.user?.id, currentUser?.id))?.role || null

  return (
    <div className="app-container">
      {/* Toast Notifications Banner */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-message ${toast.type}`}>
            {toast.type === 'error' && <AlertCircle size={18} />}
            {toast.type === 'success' && <CheckCircle size={18} />}
            {toast.type === 'info' && <Info size={18} />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* MOBILE TOP HEADER BAR */}
      <header className="mobile-top-header">
        <button
          type="button"
          className="icon-btn"
          onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
          title="Toggle Navigation Menu"
        >
          <Menu size={22} color="#fff" />
        </button>

        <div className="mobile-brand-title">
          <img src="/dcodes-logo.png" alt="D-Codes" className="mobile-brand-logo" />
          <span>{viewMode === 'chat' && activeCommunity ? activeCommunity.name : 'D-Codes'}</span>
        </div>

        <div>
          {currentUser ? (
            <button type="button" className="icon-btn" onClick={openProfileEdit} title="Profile">
              <img
                src={getAvatarUrl(currentUser.avatarUrl, currentUser.fullName)}
                alt=""
                style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
              />
            </button>
          ) : (
            <button type="button" className="send-btn" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => setShowLoginModal(true)}>
              Login
            </button>
          )}
        </div>
      </header>

      {/* MOBILE DRAWER OVERLAY BACKDROP */}
      <div
        className={`mobile-drawer-backdrop ${isMobileDrawerOpen ? 'open' : ''}`}
        onClick={() => setIsMobileDrawerOpen(false)}
      />

      {/* MOBILE SLIDE-OVER DRAWER CONTAINER */}
      <div className={`mobile-drawer-container ${isMobileDrawerOpen ? 'open' : ''}`}>
        <aside className="server-sidebar">
          <button
            className={`server-icon ${viewMode === 'explore' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('explore')
              setIsMobileDrawerOpen(false)
            }}
            title="D-Codes - Explore Hubs"
            style={{ background: '#090d16', padding: 3, border: '1px solid #6366f166' }}
          >
            <img src="/dcodes-logo.png" alt="D-Codes" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
          </button>

          <button
            className={`server-icon ${viewMode === 'resources' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('resources')
              fetchResources(selectedDomainFilter)
              setIsMobileDrawerOpen(false)
            }}
            title="Student Resource Vault"
          >
            <BookOpen size={24} />
          </button>

          <div className="server-divider" />

          {joinedCommunities.map((comm) => (
            <button
              key={comm.id}
              className={`server-icon ${activeCommunity?.id === comm.id && viewMode === 'chat' ? 'active' : ''}`}
              onClick={() => {
                fetchCommunityDetails(comm.id)
                setViewMode('chat')
                setIsMobileDrawerOpen(false)
              }}
              title={comm.name}
            >
              <CommunityServerIcon comm={comm} />
            </button>
          ))}

          <button
            className="server-icon"
            onClick={() => {
              setIsMobileDrawerOpen(false)
              if (!currentUser) {
                setShowLoginModal(true)
              } else {
                setShowCreateCommunityModal(true)
              }
            }}
            title="Create Student Hub"
          >
            <Plus size={24} />
          </button>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            {currentUser ? (
              <button
                className="server-icon"
                onClick={() => {
                  openProfileEdit()
                  setIsMobileDrawerOpen(false)
                }}
                title={`Logged in as ${currentUser.fullName} (@${currentUser.username})`}
                style={{ padding: 0, overflow: 'hidden', border: '2px solid rgba(99,102,241,0.5)' }}
              >
                <img
                  src={getAvatarUrl(currentUser.avatarUrl, currentUser.fullName)}
                  alt={currentUser.fullName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </button>
            ) : (
              <button
                className="server-icon"
                onClick={() => {
                  setShowLoginModal(true)
                  setIsMobileDrawerOpen(false)
                }}
                title="Log In"
              >
                <LogIn size={20} />
              </button>
            )}
          </div>
        </aside>

        {viewMode === 'chat' && activeCommunity && (
          <aside className="channels-drawer">
        <div className="community-header">
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="community-title">{activeCommunity?.name || 'D-Codes'}</div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {isOwner && activeCommunity && (
                  <>
                    <button
                      className="icon-btn"
                      onClick={openEditCommunityModal}
                      title="Edit Server Settings (Owner Control)"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      className="icon-btn"
                      style={{ color: '#f87171' }}
                      onClick={() => handleDeleteCommunity(activeCommunity.id)}
                      title="Delete Server (Owner Only)"
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
                {activeUserRole === 'admin' && activeCommunity && (
                  <button
                    className="icon-btn"
                    onClick={() => {
                      fetchCommunityMembers(activeCommunity.id)
                      setShowMembersModal(true)
                    }}
                    title="Admin Moderation Panel"
                  >
                    <Shield size={15} color="#818cf8" />
                  </button>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
              {activeCommunity && <span className="domain-badge">{activeCommunity.domainTag}</span>}
              {activeUserRole === 'owner' ? (
                <span className="role-badge owner" title="Community Owner">
                  <Crown size={12} /> Owner
                </span>
              ) : activeUserRole === 'admin' ? (
                <span className="role-badge admin" title="Community Admin">
                  <Shield size={12} /> Admin
                </span>
              ) : activeUserRole === 'member' ? (
                <span className="role-badge member" title="Community Member">
                  <GraduationCap size={12} /> Member
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="channel-list">
          <div className="channel-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Channels</span>
            {(isOwner || activeUserRole === 'admin') && (
              <button
                onClick={() => setShowCreateChannelModal(true)}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: 2 }}
                title={isOwner ? "Create Channel (Owner)" : "Create Channel (Admin)"}
              >
                <Plus size={16} />
              </button>
            )}
          </div>

          {activeCommunity?.channels?.map((ch) => (
            <div
              key={ch.id}
              className={`channel-item ${activeChannel?.id === ch.id && viewMode === 'chat' ? 'active' : ''}`}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onClick={() => {
                selectChannel(ch)
                setViewMode('chat')
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Hash size={18} />
                <span>{ch.name}</span>
              </div>
              {(isOwner || activeUserRole === 'admin') && activeCommunity.channels && activeCommunity.channels.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteChannel(ch.id)
                  }}
                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', opacity: 0.7, padding: 2 }}
                  title={isOwner ? "Delete Channel (Owner)" : "Delete Channel (Admin)"}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}

          {activeCommunity && (!activeCommunity.channels || activeCommunity.channels.length === 0) && (
            <div style={{ padding: '12px 8px', fontSize: 12, color: 'var(--text-muted)' }}>
              No channels yet.{isOwner ? ' Click + to create one.' : ''}
            </div>
          )}

          <div className="channel-section-title" style={{ marginTop: 16 }}>
            Quick Actions
          </div>
          <div
            className="channel-item"
            onClick={() => {
              setViewMode('resources')
              fetchResources(selectedDomainFilter)
            }}
          >
            <Share2 size={18} />
            <span>Domain Resources</span>
          </div>

          {activeCommunity && (
            <div
              className="channel-item"
              onClick={() => {
                fetchCommunityMembers(activeCommunity.id)
                setShowMembersModal(true)
              }}
            >
              <Users size={18} />
              <span>Community Roster</span>
            </div>
          )}
        </div>

        {/* User Profile Bar */}
        <div className="user-profile-bar">
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div className="user-info" style={{ cursor: 'pointer' }} onClick={openProfileEdit}>
                <div className="avatar-wrapper">
                  <img
                    src={getAvatarUrl(currentUser.avatarUrl, currentUser.fullName)}
                    alt={currentUser.fullName}
                    className="avatar-img"
                  />
                  <div className="status-dot" />
                </div>
                <div>
                  <div className="user-name">{currentUser.fullName}</div>
                  <div className="user-handle">@{currentUser.username}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="icon-btn" onClick={openProfileEdit} title="Edit Profile">
                  <Edit3 size={15} />
                </button>
                <button className="icon-btn" onClick={handleLogout} title="Log Out">
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <button
                className="send-btn"
                style={{ flex: 1, padding: '6px 12px', fontSize: 12, justifyContent: 'center' }}
                onClick={() => setShowLoginModal(true)}
              >
                <LogIn size={14} />
                <span>Log In</span>
              </button>
              <button
                className="upvote-btn"
                style={{ flex: 1, padding: '6px 12px', fontSize: 12, justifyContent: 'center' }}
                onClick={() => setShowSignupModal(true)}
              >
                <UserPlus size={14} />
                <span>Sign Up</span>
              </button>
            </div>
          )}
        </div>
      </aside>
      )}
      </div>

      {/* 3. MAIN STAGE */}
      <main className="main-stage">
        {/* ZERO DATA EMPTY STATE */}
        {communities.length === 0 && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 40,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8',
                marginBottom: 20,
              }}
            >
              <Plus size={36} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
              No Communities Created Yet
            </h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: 460, fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}>
              Your student network is currently clean with zero initial data. Launch your peer group community server or log in to start real-time messaging and resource sharing!
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              {!currentUser && (
                <button
                  className="upvote-btn"
                  style={{ padding: '10px 20px', fontSize: 14 }}
                  onClick={() => setShowSignupModal(true)}
                >
                  <UserPlus size={16} />
                  <span>Create Account</span>
                </button>
              )}
              <button
                className="send-btn"
                style={{ padding: '10px 20px', fontSize: 14 }}
                onClick={() => {
                  if (!currentUser) setShowLoginModal(true)
                  else setShowCreateCommunityModal(true)
                }}
              >
                <Plus size={16} />
                <span>Create Community Server</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW 1: CHAT FEED */}
        {communities.length > 0 && viewMode === 'chat' && activeChannel && (
          <div className="chat-view-container">
            <header className="chat-header">
              <div className="channel-header-title">
                <Hash size={20} className="text-muted" />
                <span>{activeChannel.name}</span>
                <span className="channel-header-topic">{activeChannel.topic || 'Student Collaboration Channel'}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {currentUser && activeCommunity && !isMember && (
                  activeCommunity.isPrivate ? (
                    userPendingJoinRequests[activeCommunity.id] ? (
                      <button className="upvote-btn" style={{ padding: '6px 14px', fontSize: 12, cursor: 'default' }} disabled>
                        ⏳ Request Pending
                      </button>
                    ) : (
                      <button
                        className="send-btn"
                        style={{ padding: '6px 14px', fontSize: 12, background: '#8b5cf6' }}
                        onClick={() => handleCreateJoinRequest(activeCommunity.id)}
                      >
                        🔒 Request to Join Server
                      </button>
                    )
                  ) : (
                    <button
                      className="send-btn"
                      style={{ padding: '6px 14px', fontSize: 12 }}
                      onClick={() => handleJoinCommunity(activeCommunity.id)}
                    >
                      Join Server
                    </button>
                  )
                )}
                {currentUser && activeCommunity && isMember && !isOwner && (
                  <button
                    className="danger-btn"
                    onClick={() => handleLeaveCommunity(activeCommunity.id)}
                  >
                    Leave Server
                  </button>
                )}
                {activeCommunity && (
                  <button
                    className="icon-btn"
                    onClick={() => {
                      fetchCommunityMembers(activeCommunity.id)
                      if (isOwner || activeUserRole === 'admin') {
                        fetchJoinRequests(activeCommunity.id)
                      }
                      setShowMembersModal(true)
                    }}
                    title="View Members & Moderation Roster"
                  >
                    <Users size={16} />
                  </button>
                )}
              </div>
            </header>

            <div className="message-feed">
              {messages.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 24, paddingBottom: 40 }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: 'rgba(99, 102, 241, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#818cf8',
                      marginBottom: 14,
                    }}
                  >
                    <Hash size={30} />
                  </div>
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
                    Welcome to #{activeChannel.name}!
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 500, margin: 0 }}>
                    {activeChannel.topic || `This is the start of the #${activeChannel.name} text channel.`} Be the first to start a conversation with fellow students!
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const hasParent = Boolean(msg.parentId)
                  const parentMsg = hasParent ? messages.find((m) => m.id === msg.parentId) : null

                  return (
                    <div key={msg.id} className="message-card">
                      {/* Floating Action Bar */}
                      <div className="message-action-bar">
                        <div className="action-bar-inner">
                          <button
                            className="action-btn"
                            title="Add Reaction"
                            onClick={() =>
                              setActiveReactionPickerMessageId((prev) => (prev === msg.id ? null : msg.id))
                            }
                          >
                            <Smile size={14} />
                          </button>
                          <button
                            className="action-btn"
                            title="Reply"
                            onClick={() => setReplyingToMessage(msg)}
                          >
                            <Reply size={14} />
                          </button>
                          {(currentUser?.id === msg.userId || isOwner || activeUserRole === 'admin') && (
                            <button
                              className="action-btn danger"
                              title={currentUser?.id === msg.userId ? "Delete Message" : isOwner ? "Delete Message (Owner Moderation)" : "Delete Message (Admin Moderation)"}
                              onClick={() => handleDeleteMessage(msg.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Emoji Picker Popover */}
                      {activeReactionPickerMessageId === msg.id && (
                        <div className="emoji-picker-popover">
                          {['👍', '❤️', '🔥', '😂', '🚀', '💡', '🎉'].map((emoji) => (
                            <button
                              key={emoji}
                              className="emoji-option"
                              onClick={() => handleToggleReaction(msg.id, emoji)}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="avatar-wrapper">
                        <img
                          src={getAvatarUrl(msg.user?.avatarUrl, msg.user?.fullName || msg.user?.username)}
                          alt={msg.user?.fullName || 'Student'}
                          className="avatar-img"
                        />
                      </div>
                      <div className="message-content">
                        {/* Quoted Reply Snippet */}
                        {parentMsg && (
                          <div className="message-reply-quote">
                            <CornerUpLeft size={12} style={{ color: '#818cf8' }} />
                            <span className="reply-quote-user">@{parentMsg.user?.fullName || 'Student'}</span>
                            <span className="reply-quote-text">
                              "{parentMsg.content?.slice(0, 60) || 'Attachment'}"
                            </span>
                          </div>
                        )}

                        <div className="message-header">
                          <span className="author-name">{msg.user?.fullName || 'Student'}</span>
                          {msg.user?.domainInterests && (
                            <div className="message-domain-badges">
                              {msg.user.domainInterests.split(',').map((domain) => (
                                <span key={domain.trim()} className="student-domain-pill">
                                  {domain.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                          <span className="message-time">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="message-text">{renderFormattedContent(msg.content)}</div>

                        {/* Reaction Badges */}
                        {msg.reactions && (() => {
                          try {
                            const reactionsMap: Record<string, number[]> = JSON.parse(msg.reactions)
                            const entries = Object.entries(reactionsMap)
                            if (entries.length === 0) return null

                            return (
                              <div className="message-reactions-row">
                                {entries.map(([emoji, userIds]) => {
                                  const count = userIds.length
                                  const hasReacted = currentUser ? userIds.includes(currentUser.id) : false
                                  return (
                                    <button
                                      key={emoji}
                                      className={`reaction-pill ${hasReacted ? 'active' : ''}`}
                                      onClick={() => handleToggleReaction(msg.id, emoji)}
                                      title={`${count} reaction${count > 1 ? 's' : ''}`}
                                    >
                                      <span>{emoji}</span>
                                      <span className="reaction-count">{count}</span>
                                    </button>
                                  )
                                })}
                              </div>
                            )
                          } catch (e) {
                            return null
                          }
                        })()}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="chat-composer-area">
              {typingUsers.length > 0 && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
                </div>
              )}
              {isMember ? (
                <form onSubmit={handleSendMessage} className="composer-box">
                  {replyingToMessage && (
                    <div className="composer-replying-bar">
                      <div className="replying-info">
                        <CornerUpLeft size={13} style={{ color: '#818cf8' }} />
                        <span>
                          Replying to <strong>@{replyingToMessage.user?.fullName || 'Student'}</strong>
                        </span>
                        <span className="replying-snippet">"{replyingToMessage.content.slice(0, 50)}..."</span>
                      </div>
                      <button type="button" className="replying-close-btn" onClick={() => setReplyingToMessage(null)}>
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  {attachedFiles.length > 0 && (
                    <div className="composer-attachments-preview">
                      {attachedFiles.map((att) => (
                        <div key={att.id} className="attachment-preview-chip">
                          {att.type.startsWith('image/') && att.dataUrl ? (
                            <img src={att.dataUrl} alt={att.name} className="chip-img-preview" />
                          ) : (
                            <File size={16} color="#818cf8" />
                          )}
                          <span className="chip-filename" title={att.name}>
                            {att.name}
                          </span>
                          <button type="button" className="chip-remove-btn" onClick={() => removeAttachment(att.id)}>
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="composer-box-row">
                    <button
                      type="button"
                      className="icon-btn attachment-btn"
                      title="Attach file or image"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip size={18} />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar,.7z,.csv,.xlsx,.json,.mp3,.mp4"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                    <textarea
                      ref={textareaRef}
                      className="composer-input"
                      placeholder={
                        isUploadingAttachment
                          ? 'Uploading attachments...'
                          : `Message #${activeChannel.name}...`
                      }
                      value={newMessageContent}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      disabled={isUploadingAttachment}
                    />
                    <button type="submit" className="send-btn" disabled={isUploadingAttachment}>
                      <span>Send</span>
                      <Send size={14} />
                    </button>
                  </div>
                </form>
              ) : (
                <div
                  className="composer-join-prompt"
                  style={{
                    padding: '16px 20px',
                    background: 'rgba(30, 41, 59, 0.7)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    color: '#cbd5e1',
                    fontSize: 14,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        background: 'rgba(129, 140, 248, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#818cf8',
                        flexShrink: 0,
                      }}
                    >
                      <Lock size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: 14, marginBottom: 2 }}>
                        You must join this community server to send messages
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>
                        Join <strong>{activeCommunity?.name || 'this server'}</strong> to participate in chat discussions and channel threads.
                      </div>
                    </div>
                  </div>
                  {activeCommunity && (
                    activeCommunity.isPrivate ? (
                      userPendingJoinRequests[activeCommunity.id] ? (
                        <button
                          className="upvote-btn"
                          style={{ padding: '8px 18px', fontSize: 13, cursor: 'default', whiteSpace: 'nowrap' }}
                          disabled
                        >
                          ⏳ Request Pending
                        </button>
                      ) : (
                        <button
                          className="send-btn"
                          style={{ padding: '8px 18px', fontSize: 13, background: '#8b5cf6', whiteSpace: 'nowrap' }}
                          onClick={() => handleCreateJoinRequest(activeCommunity.id)}
                        >
                          🔒 Request to Join
                        </button>
                      )
                    ) : (
                      <button
                        className="send-btn"
                        style={{ padding: '8px 18px', fontSize: 13, whiteSpace: 'nowrap' }}
                        onClick={() => handleJoinCommunity(activeCommunity.id)}
                      >
                        Join Server
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 1b: Community Selected But No Channels */}
        {communities.length > 0 && viewMode === 'chat' && !activeChannel && activeCommunity && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
            <Hash size={44} color="#818cf8" style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>No Channels in this Hub</h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: 420, fontSize: 14, marginBottom: 20 }}>
              {isOwner
                ? 'Get started by creating the first text channel for your student community.'
                : 'The community owner has not created any channels yet.'}
            </p>
            {isOwner && (
              <button className="send-btn" onClick={() => setShowCreateChannelModal(true)}>
                <Plus size={16} />
                <span>Create Channel</span>
              </button>
            )}
          </div>
        )}

        {/* VIEW 2: RESOURCES REPOSITORY */}
        {viewMode === 'resources' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <header className="chat-header">
              <div className="channel-header-title">
                <BookOpen size={20} color="#818cf8" />
                <span>Student Domain Resource Library</span>
              </div>
              <button className="send-btn" onClick={() => setShowShareResourceModal(true)}>
                <Plus size={16} />
                <span>Share Resource</span>
              </button>
            </header>

            <div style={{ display: 'flex', gap: 10, padding: '16px 24px', borderBottom: '1px solid var(--border-color)', overflowX: 'auto' }}>
              {['All', ...availableDomains].map((domain) => (
                <button
                  key={domain}
                  className={`domain-badge ${selectedDomainFilter === domain ? 'active' : ''}`}
                  style={{
                    cursor: 'pointer',
                    fontSize: 12,
                    padding: '6px 14px',
                    background: selectedDomainFilter === domain ? 'var(--accent-primary)' : undefined,
                    color: selectedDomainFilter === domain ? '#fff' : undefined,
                  }}
                  onClick={() => {
                    setSelectedDomainFilter(domain)
                    fetchResources(domain)
                  }}
                >
                  {domain}
                </button>
              ))}
            </div>

            <div className="resources-grid">
              {resources.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                  <BookOpen size={40} color="var(--text-dim)" style={{ marginBottom: 12, display: 'inline-block' }} />
                  <h4 style={{ color: '#fff', fontSize: 16, marginBottom: 6 }}>No resources shared yet</h4>
                  <p style={{ fontSize: 13 }}>Be the first student to publish a learning link or documentation guide!</p>
                </div>
              ) : (
                resources.map((res) => (
                  <ResourceCard
                    key={res.id}
                    res={res}
                    onUpvote={handleUpvote}
                    onOpenDemo={(r) => setPreviewingResource(r)}
                    onEdit={handleOpenEditResourceModal}
                    onDelete={handleDeleteResource}
                    currentUserId={currentUser?.id}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: DOMAIN EXPLORER */}
        {viewMode === 'explore' && (
          <div style={{ padding: 32, overflowY: 'auto', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <img src="/dcodes-logo.png" alt="D-Codes Logo" style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover', border: '1px solid rgba(99,102,241,0.4)' }} />
                <div>
                  <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    D-Codes Communities
                  </h1>
                  <p style={{ color: 'var(--text-muted)' }}>
                    Join competitive coding groups and student communities or launch your own group server.
                  </p>
                </div>
              </div>
              <button className="send-btn" onClick={() => setShowCreateCommunityModal(true)}>
                <Plus size={16} />
                <span>Create Community</span>
              </button>
            </div>

            {communities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                <Compass size={44} color="var(--text-dim)" style={{ marginBottom: 12, display: 'inline-block' }} />
                <h3 style={{ color: '#fff', fontSize: 18, marginBottom: 6 }}>No communities available yet</h3>
                <p style={{ fontSize: 14 }}>Create the first student community server to begin connecting with peers!</p>
              </div>
            ) : (
              <div className="explore-communities-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                {communities.map((comm) => {
                  const userIsOwner = Boolean(currentUser && isSameUser(comm.ownerId, currentUser.id))
                  const userIsMember = Boolean(
                    currentUser &&
                      (userIsOwner ||
                        (activeCommunity?.id === comm.id && communityMembersList.some((m) => isSameUser(m.userId || m.user?.id, currentUser.id))) ||
                        comm.members?.some(
                          (m: any) => isSameUser(m.userId || m.user?.id, currentUser.id)
                        ))
                  )

                  return (
                    <div key={comm.id} className="resource-card">
                      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                        <CommunityCardAvatar comm={comm} size={48} />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{comm.name}</h3>
                            {userIsOwner ? (
                              <span
                                className="domain-badge"
                                style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '2px 8px', fontSize: 11 }}
                              >
                                👑 Owner
                              </span>
                            ) : userIsMember ? (
                              <span
                                className="domain-badge"
                                style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '2px 8px', fontSize: 11 }}
                              >
                                ✓ Joined
                              </span>
                            ) : null}
                          </div>
                          <span className="domain-badge" style={{ marginTop: 4, display: 'inline-block' }}>
                            {comm.domainTag}
                          </span>
                        </div>
                      </div>
                      <p className="resource-desc" style={{ marginTop: 12 }}>{comm.description}</p>
                      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                        {userIsMember ? (
                          <button
                            className="send-btn"
                            style={{ flex: 1, justifyContent: 'center' }}
                            onClick={() => {
                              fetchCommunityDetails(comm.id)
                              setViewMode('chat')
                            }}
                          >
                            Enter Server
                          </button>
                        ) : (
                          <>
                            <button
                              className="upvote-btn"
                              style={{ flex: 1, justifyContent: 'center' }}
                              onClick={() => {
                                fetchCommunityDetails(comm.id)
                                setViewMode('chat')
                              }}
                            >
                              Preview Server
                            </button>
                            {comm.isPrivate ? (
                              userPendingJoinRequests[comm.id] ? (
                                <button className="upvote-btn" style={{ padding: '8px 14px', cursor: 'default', opacity: 0.8 }} disabled>
                                  ⏳ Request Pending
                                </button>
                              ) : (
                                <button
                                  className="send-btn"
                                  style={{ padding: '8px 14px', background: '#8b5cf6', whiteSpace: 'nowrap' }}
                                  onClick={() => handleCreateJoinRequest(comm.id)}
                                >
                                  🔒 Request to Join
                                </button>
                              )
                            ) : (
                              <button
                                className="send-btn"
                                style={{ padding: '8px 14px', whiteSpace: 'nowrap' }}
                                onClick={() => handleJoinCommunity(comm.id)}
                              >
                                Join Server
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="mobile-bottom-nav">
        <button
          type="button"
          className={`mobile-nav-item ${viewMode === 'explore' ? 'active' : ''}`}
          onClick={() => {
            setViewMode('explore')
            setIsMobileDrawerOpen(false)
          }}
        >
          <Compass size={20} />
          <span>Explore</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${viewMode === 'resources' ? 'active' : ''}`}
          onClick={() => {
            setViewMode('resources')
            fetchResources(selectedDomainFilter)
            setIsMobileDrawerOpen(false)
          }}
        >
          <BookOpen size={20} />
          <span>Vault</span>
        </button>

        {activeCommunity && (
          <button
            type="button"
            className={`mobile-nav-item ${viewMode === 'chat' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('chat')
              setIsMobileDrawerOpen(false)
            }}
          >
            <MessageSquare size={20} />
            <span>Chat</span>
          </button>
        )}

        <button
          type="button"
          className="mobile-nav-item"
          onClick={() => {
            setIsMobileDrawerOpen(!isMobileDrawerOpen)
          }}
        >
          <Menu size={20} />
          <span>Menu</span>
        </button>
      </nav>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <img src="/dcodes-logo.png" alt="D-Codes" style={{ width: 48, height: 48, borderRadius: 10, marginBottom: 8, border: '1px solid rgba(99,102,241,0.4)' }} />
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>Welcome to D-Codes</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Log in to access your competitive coding hubs</p>
            </div>

            <div className="oauth-btn-group">
              <button type="button" className="oauth-btn" style={{ justifyContent: 'center' }} onClick={() => handleOAuthLogin('google')}>
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" width={18} alt="Google" />
                <span>Continue with Google</span>
              </button>
            </div>

            <div className="auth-divider">Or continue with Email</div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="student@university.edu"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="button" className="icon-btn" onClick={() => setShowLoginModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="send-btn">
                  Log In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SIGNUP MODAL */}
      {showSignupModal && (
        <div className="modal-overlay" onClick={() => setShowSignupModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <img src="/dcodes-logo.png" alt="D-Codes" style={{ width: 48, height: 48, borderRadius: 10, marginBottom: 8, border: '1px solid rgba(99,102,241,0.4)' }} />
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>Join D-Codes</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Create an account to start collaborating with coders</p>
            </div>

            <div className="oauth-btn-group">
              <button type="button" className="oauth-btn" style={{ justifyContent: 'center' }} onClick={() => handleOAuthLogin('google')}>
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" width={18} alt="Google" />
                <span>Sign up with Google</span>
              </button>
            </div>

            <div className="auth-divider">Or continue with Email</div>

            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sarah Jenkins"
                  value={signupFullName}
                  onChange={(e) => setSignupFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. sarah_cs"
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="sarah@university.edu"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Primary Domain Interest</label>
                <select
                  className="form-input"
                  value={signupDomains}
                  onChange={(e) => {
                    setSignupDomains(e.target.value)
                    if (e.target.value !== 'Other') setCustomSignupDomains('')
                  }}
                >
                  {availableDomains.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                  <option value="Other">+ Create New Category (Other)</option>
                </select>
              </div>

              {signupDomains === 'Other' && (
                <div className="form-group">
                  <label>Custom Category Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Competitive Coding, Robotics..."
                    value={customSignupDomains}
                    onChange={(e) => setCustomSignupDomains(e.target.value)}
                    required
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="button" className="icon-btn" onClick={() => setShowSignupModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="send-btn">
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OAUTH 2.0 ACCOUNT SELECTOR MODAL */}
      {showOAuthModal && (
        <div className="modal-overlay" onClick={() => setShowOAuthModal(false)}>
          <div className="modal-content" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <img
                src={
                  oauthProvider === 'google'
                    ? 'https://www.svgrepo.com/show/475656/google-color.svg'
                    : oauthProvider === 'github'
                    ? 'https://www.svgrepo.com/show/512317/github-142.svg'
                    : 'https://www.svgrepo.com/show/448234/linkedin.svg'
                }
                width={36}
                height={36}
                alt={oauthProvider}
                style={{ marginBottom: 10 }}
              />
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>Sign in with {oauthProvider.toUpperCase()}</h2>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                to continue to <strong style={{ color: '#fff' }}>D-Codes</strong>
              </div>
            </div>

            {savedAccounts.length > 0 && !showCustomOAuthForm ? (
              <div className="account-picker-list">
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, letterSpacing: 0.5 }}>
                  Accounts on this computer ({savedAccounts.length})
                </div>
                {savedAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    className="account-picker-item"
                    onClick={() => handleDirectAccountLogin(acc.email, acc.fullName)}
                  >
                    <img
                      src={getAvatarUrl(acc.avatarUrl, acc.fullName || acc.email)}
                      alt={acc.fullName}
                      className="account-picker-avatar"
                    />
                    <div className="account-picker-info" style={{ flex: 1 }}>
                      <span className="account-picker-name">{acc.fullName}</span>
                      <span className="account-picker-email">{acc.email}</span>
                    </div>
                    <span
                      title="Remove account from this computer"
                      onClick={(e) => removeSavedAccountFromComputer(acc.email, e)}
                      style={{
                        padding: '4px 8px',
                        color: '#ff4d4f',
                        opacity: 0.7,
                        fontSize: 12,
                        cursor: 'pointer',
                        borderRadius: 4,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
                    >
                      Remove
                    </span>
                  </button>
                ))}

                <button
                  className="account-picker-item"
                  style={{ borderStyle: 'dashed', justifyContent: 'center', marginTop: 10 }}
                  onClick={() => setShowCustomOAuthForm(true)}
                >
                  <Plus size={16} color="var(--accent-primary)" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-primary)' }}>
                    Use another {oauthProvider.toUpperCase()} account
                  </span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {savedAccounts.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                    No accounts stored on this computer yet. Enter your real {oauthProvider.toUpperCase()} account details to sign in:
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Enter account details</span>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: 12, cursor: 'pointer' }}
                      onClick={() => setShowCustomOAuthForm(false)}
                    >
                      ← Back to saved accounts
                    </button>
                  </div>
                )}

                <form onSubmit={handleExecuteOAuth} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="form-group">
                    <label>{oauthProvider.toUpperCase()} Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="e.g. your.real.email@gmail.com"
                      value={oauthEmail}
                      onChange={(e) => setOauthEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <label>Your Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Real Name"
                      value={oauthFullName}
                      onChange={(e) => setOauthFullName(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="send-btn" style={{ justifyContent: 'center', marginTop: 6 }}>
                    Sign In with {oauthProvider.toUpperCase()} Account
                  </button>
                </form>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
              <div style={{ background: 'rgba(66, 133, 244, 0.08)', border: '1px solid rgba(66, 133, 244, 0.2)', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#4285f4', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" width={14} height={14} alt="Google" />
                  Redirect directly to accounts.google.com
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                  To open Google's official accounts.google.com page in your browser, enter your Google Cloud Client ID below:
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontSize: 11, padding: '5px 8px', flex: 1 }}
                    placeholder="e.g. 123456-xxx.apps.googleusercontent.com"
                    value={googleClientId}
                    onChange={(e) => setGoogleClientId(e.target.value)}
                  />
                  <button
                    type="button"
                    className="send-btn"
                    style={{ fontSize: 11, padding: '5px 10px', whiteSpace: 'nowrap' }}
                    onClick={() => handleRedirectToGoogleOAuth(googleClientId)}
                  >
                    Go to accounts.google.com ↗
                  </button>
                </div>
              </div>

              <button type="button" className="icon-btn" style={{ justifyContent: 'center' }} onClick={() => setShowOAuthModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>Manage Student Profile</h2>
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  className="form-input"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Avatar URL</label>
                <input
                  type="url"
                  className="form-input"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Domain Interests (comma-separated)</label>
                <input
                  type="text"
                  className="form-input"
                  value={editDomains}
                  onChange={(e) => setEditDomains(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="button" className="icon-btn" onClick={() => setShowProfileModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="send-btn">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT COMMUNITY MODAL (OWNER ONLY) */}
      {showEditCommunityModal && (
        <div className="modal-overlay" onClick={() => setShowEditCommunityModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>Edit Server Details</h2>
            <form onSubmit={handleUpdateCommunity} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label>Community Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editCommName}
                  onChange={(e) => setEditCommName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Domain Tag</label>
                <select
                  className="form-input"
                  value={editCommDomain}
                  onChange={(e) => {
                    setEditCommDomain(e.target.value)
                    if (e.target.value !== 'Other') setCustomEditCommDomain('')
                  }}
                >
                  {availableDomains.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                  <option value="Other">+ Create New Category (Other)</option>
                </select>
              </div>

              {editCommDomain === 'Other' && (
                <div className="form-group">
                  <label>Custom Category Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Competitive Coding, Robotics..."
                    value={customEditCommDomain}
                    onChange={(e) => setCustomEditCommDomain(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>Community Icon</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {editCommIcon && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
                      <img src={getFullUrl(editCommIcon)} alt="Icon Preview" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {editCommIcon}
                      </span>
                      <button
                        type="button"
                        className="chip-remove-btn"
                        onClick={() => setEditCommIcon('')}
                        title="Remove icon"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ flex: 1 }}
                      placeholder="https://... or upload local image"
                      value={editCommIcon}
                      onChange={(e) => setEditCommIcon(e.target.value)}
                    />
                    <button
                      type="button"
                      className="send-btn"
                      style={{ padding: '8px 14px', fontSize: 12, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
                      onClick={() => editIconFileInputRef.current?.click()}
                      disabled={isUploadingCommIcon}
                    >
                      <Upload size={14} />
                      <span>{isUploadingCommIcon ? 'Uploading...' : 'Upload Image'}</span>
                    </button>
                    <input
                      ref={editIconFileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleUploadCommunityIcon(e, 'edit')}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={editCommDesc}
                  onChange={(e) => setEditCommDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                <input
                  type="checkbox"
                  id="editCommIsPrivate"
                  checked={editCommIsPrivate}
                  onChange={(e) => setEditCommIsPrivate(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                />
                <label htmlFor="editCommIsPrivate" style={{ cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 600 }}>
                  Require Approval to Join (Private Server Mode)
                </label>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="button" className="icon-btn" onClick={() => setShowEditCommunityModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="send-btn">
                  Update Server
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE COMMUNITY MODAL */}
      {showCreateCommunityModal && (
        <div className="modal-overlay" onClick={() => setShowCreateCommunityModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>Create Student Hub</h2>
            <form onSubmit={handleCreateCommunity} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label>Community Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Stanford AI Research Lab"
                  value={newCommName}
                  onChange={(e) => setNewCommName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Domain Tag</label>
                <select
                  className="form-input"
                  value={newCommDomain}
                  onChange={(e) => {
                    setNewCommDomain(e.target.value)
                    if (e.target.value !== 'Other') setCustomNewCommDomain('')
                  }}
                >
                  {availableDomains.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                  <option value="Other">+ Create New Category (Other)</option>
                </select>
              </div>

              {newCommDomain === 'Other' && (
                <div className="form-group">
                  <label>Custom Category Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Competitive Coding, AI Research..."
                    value={customNewCommDomain}
                    onChange={(e) => setCustomNewCommDomain(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>Community Icon</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {newCommIcon && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
                      <img src={getFullUrl(newCommIcon)} alt="Icon Preview" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {newCommIcon}
                      </span>
                      <button
                        type="button"
                        className="chip-remove-btn"
                        onClick={() => setNewCommIcon('')}
                        title="Remove icon"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ flex: 1 }}
                      placeholder="https://... or upload local image"
                      value={newCommIcon}
                      onChange={(e) => setNewCommIcon(e.target.value)}
                    />
                    <button
                      type="button"
                      className="send-btn"
                      style={{ padding: '8px 14px', fontSize: 12, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
                      onClick={() => createIconFileInputRef.current?.click()}
                      disabled={isUploadingCommIcon}
                    >
                      <Upload size={14} />
                      <span>{isUploadingCommIcon ? 'Uploading...' : 'Upload Image'}</span>
                    </button>
                    <input
                      ref={createIconFileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleUploadCommunityIcon(e, 'create')}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="What is this community hub about?"
                  value={newCommDesc}
                  onChange={(e) => setNewCommDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                <input
                  type="checkbox"
                  id="newCommIsPrivate"
                  checked={newCommIsPrivate}
                  onChange={(e) => setNewCommIsPrivate(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                />
                <label htmlFor="newCommIsPrivate" style={{ cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 600 }}>
                  Require Approval to Join (Private Server Mode)
                </label>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="button" className="icon-btn" onClick={() => setShowCreateCommunityModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="send-btn">
                  Create Server
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CHANNEL MODAL (OWNER ONLY) */}
      {showCreateChannelModal && (
        <div className="modal-overlay" onClick={() => setShowCreateChannelModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>Create Text Channel</h2>
            <form onSubmit={handleCreateChannel} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label>Channel Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. project-showcase"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Channel Topic</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="What is discussed in this channel?"
                  value={newChannelTopic}
                  onChange={(e) => setNewChannelTopic(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="button" className="icon-btn" onClick={() => setShowCreateChannelModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="send-btn">
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMMUNITY MEMBERS ROSTER & MODERATION MODAL */}
      {showMembersModal && (
        <div className="modal-overlay" onClick={() => setShowMembersModal(false)}>
          <div className="modal-content" style={{ width: 500 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 18, fontWeight: 800 }}>Server Roster & Member Management</h2>
                <button className="icon-btn" onClick={() => setShowMembersModal(false)}>✕</button>
              </div>

              {/* Direct Add Member Bar for Owner & Admin */}
              {(isOwner || activeUserRole === 'admin') && (
                <form onSubmit={handleAddMemberByUsername} style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ flex: 1, padding: '6px 10px', fontSize: 12 }}
                    placeholder="Enter @username or email to add..."
                    value={addMemberUsername}
                    onChange={(e) => setAddMemberUsername(e.target.value)}
                    required
                  />
                  <button type="submit" className="send-btn" style={{ padding: '6px 12px', fontSize: 12 }} disabled={isAddingMember}>
                    <UserPlus size={14} />
                    <span>{isAddingMember ? 'Adding...' : 'Add Member'}</span>
                  </button>
                </form>
              )}

              {/* Tab Switcher for Members vs Join Requests */}
              {(isOwner || activeUserRole === 'admin') && (
                <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8 }}>
                  <button
                    className={`domain-badge ${activeRosterTab === 'members' ? 'active' : ''}`}
                    style={{ cursor: 'pointer', padding: '6px 12px', background: activeRosterTab === 'members' ? 'var(--accent-primary)' : undefined, color: activeRosterTab === 'members' ? '#fff' : undefined }}
                    onClick={() => setActiveRosterTab('members')}
                  >
                    Members ({communityMembersList.length})
                  </button>

                  <button
                    className={`domain-badge ${activeRosterTab === 'requests' ? 'active' : ''}`}
                    style={{ cursor: 'pointer', padding: '6px 12px', background: activeRosterTab === 'requests' ? 'var(--accent-primary)' : undefined, color: activeRosterTab === 'requests' ? '#fff' : undefined, display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={() => {
                      setActiveRosterTab('requests')
                      if (activeCommunity) fetchJoinRequests(activeCommunity.id)
                    }}
                  >
                    <span>Pending Requests ({joinRequests.length})</span>
                    {joinRequests.length > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{joinRequests.length}</span>}
                  </button>
                </div>
              )}
            </div>

            {activeRosterTab === 'members' ? (
              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                {communityMembersList.map((mem) => {
                  const memUser = mem.user
                  const isMemOwner = activeCommunity && activeCommunity.ownerId === memUser?.id
                  return (
                    <div key={mem.id} className="member-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img
                          src={getAvatarUrl(memUser?.avatarUrl, memUser?.fullName || memUser?.username)}
                          alt={memUser?.fullName}
                          style={{ width: 36, height: 36, borderRadius: '50%' }}
                        />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                            {memUser?.fullName || 'Student'}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{memUser?.username}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isMemOwner ? (
                          <span className="role-badge owner">
                            <Crown size={12} /> Owner
                          </span>
                        ) : mem.role === 'admin' ? (
                          <span className="role-badge admin">
                            <Shield size={12} /> Admin
                          </span>
                        ) : (
                          <span className="role-badge member">
                            <GraduationCap size={12} /> Member
                          </span>
                        )}

                        {/* Role Management (Owner Only) & Kick Moderation (Owner & Admin) */}
                        {!isMemOwner && memUser && (
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            {isOwner && (
                              <select
                                value={mem.role || 'member'}
                                onChange={(e) => handleUpdateMemberRole(memUser.id, e.target.value as 'admin' | 'member')}
                                className="form-input"
                                style={{ padding: '2px 6px', fontSize: 11, width: 'auto' }}
                                title="Assign Role (Owner Control)"
                              >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                              </select>
                            )}

                            {(isOwner || (activeUserRole === 'admin' && mem.role === 'member')) && (
                              <button
                                className="danger-btn"
                                style={{ padding: '4px 8px', fontSize: 11 }}
                                onClick={() => handleKickMember(memUser.id)}
                                title={isOwner ? "Kick Member (Owner)" : "Kick Member (Admin)"}
                              >
                                <UserMinus size={13} /> Kick
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {joinRequests.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)', fontSize: 13 }}>
                    No pending join requests right now.
                  </div>
                ) : (
                  joinRequests.map((req) => (
                    <div key={req.id} className="member-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img
                          src={getAvatarUrl(req.user?.avatarUrl, req.user?.fullName || req.user?.username)}
                          alt={req.user?.fullName}
                          style={{ width: 36, height: 36, borderRadius: '50%' }}
                        />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{req.user?.fullName || 'Student'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{req.user?.username}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="send-btn"
                          style={{ padding: '4px 10px', fontSize: 11 }}
                          onClick={() => handleRespondJoinRequest(req.id, 'approve')}
                        >
                          <CheckCircle size={12} /> Approve
                        </button>
                        <button
                          className="danger-btn"
                          style={{ padding: '4px 10px', fontSize: 11 }}
                          onClick={() => handleRespondJoinRequest(req.id, 'reject')}
                        >
                          <X size={12} /> Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SHARE RESOURCE MODAL */}
      {showShareResourceModal && (
        <div className="modal-overlay" onClick={() => setShowShareResourceModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>Share Learning Resource</h2>
            <form onSubmit={handleShareResource} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label>Resource Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Deep Learning Specialization Notes"
                  value={resTitle}
                  onChange={(e) => setResTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Link / URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://github.com/..."
                  value={resUrl}
                  onChange={(e) => setResUrl(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Domain Category</label>
                <select
                  className="form-input"
                  value={resDomain}
                  onChange={(e) => {
                    setResDomain(e.target.value)
                    if (e.target.value !== 'Other') setCustomResDomain('')
                  }}
                >
                  {availableDomains.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                  <option value="Other">+ Create New Category (Other)</option>
                </select>
              </div>

              {resDomain === 'Other' && (
                <div className="form-group">
                  <label>Custom Category Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Competitive Coding, Cloud Infrastructure..."
                    value={customResDomain}
                    onChange={(e) => setCustomResDomain(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>Summary / Notes</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Why is this resource useful for students?"
                  value={resDesc}
                  onChange={(e) => setResDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="button" className="icon-btn" onClick={() => setShowShareResourceModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="send-btn">
                  Publish Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT RESOURCE MODAL */}
      {editingResource && (
        <div className="modal-overlay" onClick={() => setEditingResource(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit3 size={18} color="#818cf8" />
                <span>Edit Resource</span>
              </h2>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setEditingResource(null)}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleUpdateResource} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label>Resource Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. React Official Documentation"
                  value={editResTitle}
                  onChange={(e) => setEditResTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Resource Web Link (URL)</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://react.dev"
                  value={editResUrl}
                  onChange={(e) => setEditResUrl(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  className="form-input"
                  placeholder="Short explanation of why this resource is useful..."
                  value={editResDesc}
                  onChange={(e) => setEditResDesc(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Domain Tag</label>
                <select
                  className="form-input"
                  value={editResDomain}
                  onChange={(e) => {
                    setEditResDomain(e.target.value)
                    if (e.target.value !== 'Other') setCustomEditResDomain('')
                  }}
                >
                  {availableDomains.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                  <option value="Other">Other (Custom Domain Tag)</option>
                </select>
              </div>
              {editResDomain === 'Other' && (
                <div className="form-group">
                  <label>Custom Category Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Blockchain, DevOps..."
                    value={customEditResDomain}
                    onChange={(e) => setCustomEditResDomain(e.target.value)}
                    required
                  />
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  type="button"
                  className="upvote-btn"
                  onClick={() => setEditingResource(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="send-btn">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIVE RESOURCE DEMO MODAL */}
      {previewingResource && (
        <div className="modal-overlay" onClick={() => setPreviewingResource(null)}>
          <div className="demo-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="demo-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img
                  src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(getHostname(previewingResource.url))}&sz=64`}
                  alt=""
                  style={{ width: 22, height: 22, borderRadius: 4 }}
                />
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                    {previewingResource.title}
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {previewingResource.url}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <a
                  href={previewingResource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="send-btn"
                  style={{ padding: '6px 14px', fontSize: 12 }}
                >
                  <span>Open in New Tab</span>
                  <ExternalLink size={14} />
                </a>

                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setPreviewingResource(null)}
                  title="Close preview"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, position: 'relative', background: '#020617', display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: '#0f172a', padding: '6px 16px', fontSize: 12, color: 'var(--text-dim)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
                <span>⚡ Live Website Demo</span>
                <span>If embedded site blocks iframe framing, click "Open in New Tab" above</span>
              </div>
              <iframe
                src={previewingResource.url}
                title={previewingResource.title}
                className="demo-iframe"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
