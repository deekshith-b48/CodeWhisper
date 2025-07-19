import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Database, 
  Search, 
  FileText, 
  Code, 
  MessageSquare, 
  Link,
  Calendar,
  User,
  Tag,
  ExternalLink,
  Filter,
  SortAsc,
  SortDesc,
  RefreshCw,
  Eye,
  Trash2,
  Edit
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const KnowledgeBase = () => {
  const [documents, setDocuments] = useState([])
  const [filteredDocuments, setFilteredDocuments] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    documentation: 0,
    code: 0,
    slack: 0,
    other: 0
  })

  useEffect(() => {
    loadDocuments()
  }, [])

  useEffect(() => {
    filterAndSortDocuments()
  }, [documents, searchTerm, selectedType, sortBy, sortOrder])

  const loadDocuments = async () => {
    setIsLoading(true)
    try {
      // Fetch documents from backend API
      const response = await fetch('http://localhost:5002/api/data/documents')
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
        calculateStats(data.documents || [])
      } else {
        console.error('Failed to load documents:', response.status)
        // Fallback to mock data
        setDocuments(mockDocuments)
        calculateStats(mockDocuments)
      }
    } catch (error) {
      console.error('Error loading documents:', error)
      // Mock data for demo
      setDocuments(mockDocuments)
      calculateStats(mockDocuments)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = (docs) => {
    const stats = {
      total: docs.length,
      documentation: docs.filter(d => d.source_type === 'documentation').length,
      code: docs.filter(d => d.source_type === 'code').length,
      slack: docs.filter(d => d.source_type === 'slack').length,
      other: docs.filter(d => !['documentation', 'code', 'slack'].includes(d.source_type)).length
    }
    setStats(stats)
  }

  const filterAndSortDocuments = () => {
    let filtered = documents

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(doc => doc.source_type === selectedType)
    }

    // Sort documents
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.created_at || a.uploaded_at)
          bValue = new Date(b.created_at || b.uploaded_at)
          break
        case 'title':
          aValue = a.title?.toLowerCase()
          bValue = b.title?.toLowerCase()
          break
        case 'type':
          aValue = a.source_type?.toLowerCase()
          bValue = b.source_type?.toLowerCase()
          break
        default:
          aValue = a.title?.toLowerCase()
          bValue = b.title?.toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredDocuments(filtered)
  }

  const getSourceIcon = (sourceType) => {
    switch (sourceType) {
      case 'code': return <Code className="w-5 h-5" />
      case 'documentation': return <FileText className="w-5 h-5" />
      case 'slack': return <MessageSquare className="w-5 h-5" />
      default: return <Link className="w-5 h-5" />
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const truncateText = (text, maxLength = 150) => {
    if (!text) return ''
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  const handleRefresh = () => {
    loadDocuments()
  }

  // Mock data for demo
  const mockDocuments = [
    {
      id: 1,
      title: 'React Component Guidelines',
      content: 'This document outlines the best practices for creating React components in our codebase...',
      source_type: 'documentation',
      file_path: 'docs/react-guidelines.md',
      repository: 'codewhisperer-frontend',
      author: 'John Doe',
      tags: ['react', 'components', 'guidelines'],
      created_at: '2024-01-15T10:30:00Z',
      uploaded_at: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      title: 'Authentication Service',
      content: 'The authentication service handles user login, registration, and session management...',
      source_type: 'code',
      file_path: 'src/services/auth.js',
      repository: 'codewhisperer-backend',
      author: 'Jane Smith',
      tags: ['authentication', 'security', 'api'],
      created_at: '2024-01-14T14:20:00Z',
      uploaded_at: '2024-01-14T14:20:00Z'
    },
    {
      id: 3,
      title: 'Deployment Discussion',
      content: 'Team discussion about the new deployment strategy and CI/CD pipeline improvements...',
      source_type: 'slack',
      file_path: 'slack/deployment-discussion.txt',
      repository: 'team-slack',
      author: 'Team Lead',
      tags: ['deployment', 'ci-cd', 'discussion'],
      created_at: '2024-01-13T09:15:00Z',
      uploaded_at: '2024-01-13T09:15:00Z'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg border-4 border-black">
            <Database className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Knowledge Base</h2>
        </div>
        <p className="text-xl text-gray-700 font-medium">Browse and manage uploaded documents</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="neo-brutalism-card text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm font-medium text-gray-600">Total Documents</div>
        </div>
        <div className="neo-brutalism-card text-center">
          <div className="text-2xl font-bold text-green-600">{stats.documentation}</div>
          <div className="text-sm font-medium text-gray-600">Documentation</div>
        </div>
        <div className="neo-brutalism-card text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.code}</div>
          <div className="text-sm font-medium text-gray-600">Code</div>
        </div>
        <div className="neo-brutalism-card text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.slack}</div>
          <div className="text-sm font-medium text-gray-600">Slack</div>
        </div>
        <div className="neo-brutalism-card text-center">
          <div className="text-2xl font-bold text-gray-600">{stats.other}</div>
          <div className="text-sm font-medium text-gray-600">Other</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="neo-brutalism-card">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="neo-brutalism-input pl-10"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="neo-brutalism-input"
            >
              <option value="all">All Types</option>
              <option value="documentation">Documentation</option>
              <option value="code">Code</option>
              <option value="slack">Slack</option>
              <option value="other">Other</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="neo-brutalism-input"
            >
              <option value="date">Date</option>
              <option value="title">Title</option>
              <option value="type">Type</option>
            </select>
            
            <Button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="neo-brutalism-button-secondary"
            >
              {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </Button>
            
            <Button
              onClick={loadDocuments}
              className="neo-brutalism-button-secondary"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="neo-brutalism-loading p-8 text-center">
            <div className="flex items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="font-bold text-lg">Loading documents...</span>
            </div>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="neo-brutalism-card text-center p-12">
            <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or upload new documents.</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredDocuments.map((doc, index) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="neo-brutalism-card hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="p-2 bg-gray-100 rounded-lg border-2 border-black">
                          {getSourceIcon(doc.source_type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">{doc.title}</h3>
                            <Badge className="neo-brutalism-badge">
                              {doc.source_type}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-700 font-medium mb-3">
                            {truncateText(doc.content)}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            {doc.file_path && (
                              <div className="flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                {doc.file_path}
                              </div>
                            )}
                            {doc.repository && (
                              <div className="flex items-center gap-1">
                                <Database className="w-4 h-4" />
                                {doc.repository}
                              </div>
                            )}
                            {doc.author && (
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {doc.author}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(doc.created_at || doc.uploaded_at)}
                            </div>
                          </div>
                          
                          {doc.tags && doc.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {doc.tags.map((tag, tagIndex) => (
                                <div key={tagIndex} className="neo-brutalism-badge text-xs">
                                  <Tag className="w-3 h-3 mr-1" />
                                  {tag}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        className="neo-brutalism-button-secondary"
                        title="View Document"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        className="neo-brutalism-button-secondary"
                        title="Edit Document"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        className="neo-brutalism-error"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Results Summary */}
      {!isLoading && filteredDocuments.length > 0 && (
        <div className="neo-brutalism-card text-center">
          <p className="text-lg font-bold text-gray-900">
            Showing {filteredDocuments.length} of {documents.length} documents
          </p>
          {searchTerm && (
            <p className="text-gray-600 mt-1">
              Filtered by: "{searchTerm}"
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default KnowledgeBase

