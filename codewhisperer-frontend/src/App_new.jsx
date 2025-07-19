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
  User
} from 'lucide-react'
import { getCurrentUser, getUserProfile, signOut, supabase } from './lib/supabase'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('chat')
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          setCurrentUser(user)
          await loadUserProfile(user)
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
  }

  const handleAuthSuccess = (user) => {
    setCurrentUser(user)
    loadUserProfile(user)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!currentUser) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />
  }
  
  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI-Powered Assistance",
      description: "Get instant answers about your codebase using advanced language models"
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: "Smart Search",
      description: "Find relevant information across code, documentation, and conversations"
    },
    {
      icon: <Code className="w-6 h-6" />,
      title: "Code Understanding",
      description: "Understand functions, classes, and architectural patterns with detailed explanations"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Team Knowledge",
      description: "Access historical discussions and team decisions from Slack conversations"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CodeWhisperer</h1>
                <p className="text-sm text-gray-600">AI-Powered Developer Onboarding Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  {userProfile?.role === 'admin' ? (
                    <Shield className="w-4 h-4 text-purple-600" />
                  ) : (
                    <User className="w-4 h-4 text-blue-600" />
                  )}
                  <span className="text-sm font-medium">
                    {userProfile?.full_name || userProfile?.email}
                  </span>
                </div>
                <Badge variant={userProfile?.role === 'admin' ? 'default' : 'secondary'}>
                  {userProfile?.role === 'admin' ? 'Admin' : 'Joinee'}
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          {/* Tab Navigation */}
          <TabsList className={`grid w-full ${userProfile?.role === 'admin' ? 'grid-cols-4' : 'grid-cols-2'} mb-6`}>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat Assistant
            </TabsTrigger>
            
            {userProfile?.role === 'joinee' && (
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                My Tasks
              </TabsTrigger>
            )}

            {userProfile?.role === 'admin' && (
              <>
                <TabsTrigger value="knowledge" className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Knowledge Base
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Knowledge
                </TabsTrigger>
                <TabsTrigger value="manage-tasks" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Manage Tasks
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="chat" className="mt-0">
            <Card className="border-0 shadow-lg bg-white/50 backdrop-blur-sm">
              <ChatInterface />
            </Card>
          </TabsContent>

          {userProfile?.role === 'joinee' && (
            <TabsContent value="tasks" className="mt-0">
              <Card className="border-0 shadow-lg bg-white/50 backdrop-blur-sm p-6">
                <TaskProgress />
              </Card>
            </TabsContent>
          )}

          {userProfile?.role === 'admin' && (
            <>
              <TabsContent value="knowledge" className="mt-0">
                <Card className="border-0 shadow-lg bg-white/50 backdrop-blur-sm">
                  <KnowledgeBase />
                </Card>
              </TabsContent>

              <TabsContent value="upload" className="mt-0">
                <Card className="border-0 shadow-lg bg-white/50 backdrop-blur-sm p-6">
                  <KnowledgeUpload userRole={userProfile?.role} />
                </Card>
              </TabsContent>

              <TabsContent value="manage-tasks" className="mt-0">
                <Card className="border-0 shadow-lg bg-white/50 backdrop-blur-sm p-6">
                  <OnboardingTasksManager userRole={userProfile?.role} />
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>

        {/* Welcome Section - shown on first load */}
        {!activeTab && (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center py-12">
              <div className="mb-6">
                <div className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full w-20 h-20 mx-auto mb-4">
                  <Bot className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  Welcome to CodeWhisperer
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Your AI-powered assistant for seamless developer onboarding and knowledge discovery
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <Badge variant="outline" className="px-4 py-2">
                  <Zap className="w-4 h-4 mr-2" />
                  Powered by Gemini AI
                </Badge>
                <Badge variant="outline" className="px-4 py-2">
                  <Database className="w-4 h-4 mr-2" />
                  Smart Knowledge Base
                </Badge>
                <Badge variant="outline" className="px-4 py-2">
                  <Users className="w-4 h-4 mr-2" />
                  Role-Based Access
                </Badge>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow border-0 bg-white/60 backdrop-blur-sm">
                  <CardContent className="p-0">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
                        <div className="text-white">{feature.icon}</div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Get Started</h2>
              <div className="flex flex-wrap justify-center gap-4">
                <Button 
                  onClick={() => setActiveTab('chat')} 
                  className="flex items-center gap-2"
                  size="lg"
                >
                  <MessageSquare className="w-5 h-5" />
                  Start Chatting
                </Button>
                {userProfile?.role === 'joinee' && (
                  <Button 
                    onClick={() => setActiveTab('tasks')} 
                    variant="outline" 
                    className="flex items-center gap-2"
                    size="lg"
                  >
                    <CheckSquare className="w-5 h-5" />
                    View My Tasks
                  </Button>
                )}
                {userProfile?.role === 'admin' && (
                  <Button 
                    onClick={() => setActiveTab('upload')} 
                    variant="outline" 
                    className="flex items-center gap-2"
                    size="lg"
                  >
                    <Upload className="w-5 h-5" />
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
