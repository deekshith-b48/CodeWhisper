import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Bot, 
  Shield, 
  Users, 
  CheckSquare, 
  Upload, 
  MessageSquare,
  ArrowRight,
  Brain,
  Database,
  Zap,
  Star,
  Clock,
  Target
} from 'lucide-react'

const LandingPage = ({ onGetStarted }) => {
  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI-Powered Assistant",
      description: "Get instant answers about your codebase using advanced language models",
      color: "from-blue-600 to-purple-600"
    },
    {
      icon: <CheckSquare className="w-8 h-8" />,
      title: "Smart Onboarding",
      description: "Streamlined task management with automated progress tracking",
      color: "from-green-600 to-teal-600"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Role-Based Access",
      description: "Secure admin and joinee dashboards with proper permissions",
      color: "from-purple-600 to-pink-600"
    },
    {
      icon: <Database className="w-8 h-8" />,
      title: "Knowledge Management",
      description: "Upload and organize documentation for instant AI-powered search",
      color: "from-orange-600 to-red-600"
    }
  ]

  const benefits = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Faster Onboarding",
      description: "Reduce new employee onboarding time by 60%"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Better Compliance",
      description: "Ensure all verification tasks are completed"
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Improved Experience",
      description: "Interactive AI assistant guides new hires"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo */}
            <div className="mb-8">
              <div className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl w-24 h-24 mx-auto mb-6 shadow-2xl">
                <Bot className="w-16 h-16 text-white" />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
                Code<span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Whisperer</span>
              </h1>
              <p className="text-2xl text-gray-600 mb-8">
                AI-Powered Developer Onboarding & Knowledge Assistant
              </p>
            </div>

            {/* Value Proposition */}
            <div className="mb-12">
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                Transform your developer onboarding with intelligent task management, 
                automated verification processes, and AI-powered assistance.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <Badge variant="outline" className="px-6 py-3 text-base">
                  <Zap className="w-5 h-5 mr-2" />
                  Powered by Gemini AI
                </Badge>
                <Badge variant="outline" className="px-6 py-3 text-base">
                  <Database className="w-5 h-5 mr-2" />
                  Real-time Sync
                </Badge>
                <Badge variant="outline" className="px-6 py-3 text-base">
                  <Shield className="w-5 h-5 mr-2" />
                  Enterprise Security
                </Badge>
              </div>

              <Button 
                onClick={onGetStarted}
                size="lg" 
                className="px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything You Need for Seamless Onboarding
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From automated task management to AI-powered assistance, 
            CodeWhisperer provides all the tools for efficient developer onboarding.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:bg-white">
              <CardHeader className="text-center pb-4">
                <div className={`p-4 bg-gradient-to-br ${feature.color} rounded-xl w-20 h-20 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <div className="text-white">{feature.icon}</div>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center pt-0">
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 mb-16 shadow-xl">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose CodeWhisperer?
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg w-16 h-16 mx-auto mb-4">
                  <div className="text-white">{benefit.icon}</div>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h4>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Role-Based Access Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Admin Panel Preview */}
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6" />
                <CardTitle className="text-xl">Admin Dashboard</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Upload className="w-5 h-5 text-purple-600" />
                  <span className="font-medium">Upload Knowledge Base</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CheckSquare className="w-5 h-5 text-purple-600" />
                  <span className="font-medium">Manage Onboarding Tasks</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                  <span className="font-medium">Monitor Joinee Progress</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  <span className="font-medium">AI Chat Assistant</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Joinee Panel Preview */}
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6" />
                <CardTitle className="text-xl">Joinee Dashboard</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Complete Onboarding Tasks</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Track Progress</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Get AI Assistance</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Star className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Verify Credentials</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white shadow-2xl">
            <h3 className="text-3xl font-bold mb-4">
              Ready to Transform Your Onboarding?
            </h3>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of developers who trust CodeWhisperer for seamless onboarding experiences.
            </p>
            <Button 
              onClick={onGetStarted}
              size="lg" 
              variant="secondary"
              className="px-8 py-4 text-lg bg-white text-gray-900 hover:bg-gray-100 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
            >
              Start Your Journey
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LandingPage
