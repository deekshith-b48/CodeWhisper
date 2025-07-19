import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import ChatInterface from './components/ChatInterface'
import KnowledgeBase from './components/KnowledgeBase'
import TaskProgress from './components/TaskProgress'
import OnboardingTasksManager from './components/OnboardingTasksManager'
import KnowledgeUpload from './components/KnowledgeUpload'
import AuthForm from './components/AuthForm'
import LandingPage from './components/LandingPage'
import { 
  Bot, 
  Database, 
  MessageSquare, 
  Code, 
  Zap,
  Brain,
  Search,
  Users,
  CheckSquare,
  Upload,
  Settings,
  LogOut,
  Shield,
  User,
  Home,
  Sparkles
} from 'lucide-react'
import { getCurrentUser, getUserProfile, signOut, supabase } from './lib/hybridSupabase'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('chat')
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showLanding, setShowLanding] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          setCurrentUser(user)
          await loadUserProfile(user)
          setShowLanding(false) // Skip landing if already authenticated
        }
      } catch (error) {
        console.error('Error checking user:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user)
        setShowLanding(false)
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null)
        setUserProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (user) => {
    try {
      const { data, error } = await getUserProfile(user.id)
      if (error) {
        console.error('Error loading user profile:', error)
        // Create default profile if none exists
        setUserProfile({
          id: user.id,
          email: user.email,
          role: user.user_metadata?.role || 'joinee',
          full_name: user.user_metadata?.full_name || user.email.split('@')[0]
        })
      } else {
        setUserProfile(data)
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    setCurrentUser(null)
    setUserProfile(null)
    setShowLanding(true)
  }

  const handleAuthSuccess = (user) => {
    setCurrentUser(user)
    loadUserProfile(user)
    setShowLanding(false)
  }

  const handleGetStarted = () => {
    setShowLanding(false)
  }

  const handleBackToLanding = () => {
    setShowLanding(true)
    setActiveTab('chat')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="neo-brutalism-loading p-8">
          <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-500 rounded-lg border-2 border-black">
                  <Bot className="w-8 h-8 text-black animate-pulse" />
                </div>
            <div className="font-bold text-xl">Loading CodeWhisperer...</div>
          </div>
        </div>
      </div>
    )
  }

  // Show landing page if no user and showLanding is true
  if (showLanding && !currentUser) {
    return <LandingPage onGetStarted={handleGetStarted} />
  }

  if (!currentUser) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />
  }
  
  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI-Powered Assistance",
      description: "Get instant answers about your codebase using advanced language models with citations"
    },
    {
      icon: <Search className="w-8 h-8" />,
      title: "Smart Search",
      description: "Find relevant information across code, documentation, and conversations with source tracking"
    },
    {
      icon: <Code className="w-8 h-8" />,
      title: "Code Understanding",
      description: "Understand functions, classes, and architectural patterns with detailed explanations"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Team Knowledge",
      description: "Access historical discussions and team decisions from knowledge base"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="neo-brutalism-header sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-lg border-4 border-black">
                <Bot className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">CodeWhisperer</h1>
                <p className="text-white/90 font-medium">AI-Powered Developer Onboarding Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBackToLanding}
                className="text-white hover:bg-white/20 font-bold"
              >
                <Home className="w-4 h-4 mr-2" />
                Landing
              </Button>
              <div className="flex items-center gap-3 bg-white/20 p-3 rounded-lg border-2 border-white/30">
                <div className="flex items-center gap-2">
                  {userProfile?.role === 'admin' ? (
                    <Shield className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <User className="w-5 h-5 text-blue-400" />
                  )}
                  <span className="text-white font-bold">
                    {userProfile?.full_name || userProfile?.email}
                  </span>
                </div>
                <Badge className="neo-brutalism-badge">
                  {userProfile?.role === 'admin' ? 'Admin' : 'Joinee'}
                </Badge>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                className="text-white hover:bg-white/20 font-bold"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          {/* Tab Navigation */}
          <TabsList className={`grid w-full ${userProfile?.role === 'admin' ? 'grid-cols-4' : 'grid-cols-2'} mb-8 gap-4`}>
            <TabsTrigger 
              value="chat" 
              className="neo-brutalism-button-secondary flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              <MessageSquare className="w-5 h-5" />
              Chat Assistant
            </TabsTrigger>
            
            {userProfile?.role === 'joinee' && (
              <TabsTrigger 
                value="tasks" 
                className="neo-brutalism-button-secondary flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              >
                <CheckSquare className="w-5 h-5" />
                My Tasks
              </TabsTrigger>
            )}

            {userProfile?.role === 'admin' && (
              <>
                <TabsTrigger 
                  value="knowledge" 
                  className="neo-brutalism-button-secondary flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                >
                  <Database className="w-5 h-5" />
                  Knowledge Base
                </TabsTrigger>
                <TabsTrigger 
                  value="upload" 
                  className="neo-brutalism-button-secondary flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                >
                  <Upload className="w-5 h-5" />
                  Upload Knowledge
                </TabsTrigger>
                <TabsTrigger 
                  value="manage-tasks" 
                  className="neo-brutalism-button-secondary flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                >
                  <Settings className="w-5 h-5" />
                  Manage Tasks
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="chat" className="mt-0">
            <div className="neo-brutalism-card">
              <ChatInterface />
            </div>
          </TabsContent>

          {userProfile?.role === 'joinee' && (
            <TabsContent value="tasks" className="mt-0">
              <div className="neo-brutalism-card">
                <TaskProgress />
              </div>
            </TabsContent>
          )}

          {userProfile?.role === 'admin' && (
            <>
              <TabsContent value="knowledge" className="mt-0">
                <div className="neo-brutalism-card">
                  <KnowledgeBase />
                </div>
              </TabsContent>

              <TabsContent value="upload" className="mt-0">
                <div className="neo-brutalism-card">
                  <KnowledgeUpload userRole={userProfile?.role} />
                </div>
              </TabsContent>

              <TabsContent value="manage-tasks" className="mt-0">
                <div className="neo-brutalism-card">
                  <OnboardingTasksManager userRole={userProfile?.role} />
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>

        {/* Welcome Section - shown on first load */}
        {!activeTab && (
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="text-center py-16">
              <div className="mb-8">
                <div className="p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-32 h-32 mx-auto mb-6">
                  <Bot className="w-20 h-20 text-white" />
                </div>
                <h1 className="text-5xl font-bold text-gray-900 mb-6">
                  Welcome to CodeWhisperer
                </h1>
                <p className="text-2xl text-gray-700 max-w-3xl mx-auto font-medium">
                  Your AI-powered assistant for seamless developer onboarding and knowledge discovery with citations
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <Badge className="neo-brutalism-badge text-lg px-6 py-3">
                  <Zap className="w-5 h-5 mr-2" />
                  Powered by Gemini AI
                </Badge>
                <Badge className="neo-brutalism-badge text-lg px-6 py-3">
                  <Database className="w-5 h-5 mr-2" />
                  Smart Knowledge Base
                </Badge>
                <Badge className="neo-brutalism-badge text-lg px-6 py-3">
                  <Users className="w-5 h-5 mr-2" />
                  Role-Based Access
                </Badge>
                <Badge className="neo-brutalism-badge text-lg px-6 py-3">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Citation Tracking
                </Badge>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="neo-brutalism-card hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all duration-200">
                  <div className="flex items-start gap-6">
                    <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg border-4 border-black">
                      <div className="text-white">{feature.icon}</div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-gray-700 text-lg font-medium">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="text-center py-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Get Started</h2>
              <div className="flex flex-wrap justify-center gap-6">
                <Button 
                  onClick={() => setActiveTab('chat')} 
                  className="neo-brutalism-button text-lg px-8 py-4"
                  size="lg"
                >
                  <MessageSquare className="w-6 h-6 mr-2" />
                  Start Chatting
                </Button>
                {userProfile?.role === 'joinee' && (
                  <Button 
                    onClick={() => setActiveTab('tasks')} 
                    className="neo-brutalism-button-secondary text-lg px-8 py-4"
                    size="lg"
                  >
                    <CheckSquare className="w-6 h-6 mr-2" />
                    View My Tasks
                  </Button>
                )}
                {userProfile?.role === 'admin' && (
                  <Button 
                    onClick={() => setActiveTab('upload')} 
                    className="neo-brutalism-button-secondary text-lg px-8 py-4"
                    size="lg"
                  >
                    <Upload className="w-6 h-6 mr-2" />
                    Upload Knowledge
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
