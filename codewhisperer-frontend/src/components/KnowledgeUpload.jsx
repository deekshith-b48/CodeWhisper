import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  FileText, 
  Code, 
  MessageSquare, 
  Link,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Sparkles,
  Database,
  Plus,
  Tag
} from 'lucide-react'
import { addKnowledgeDocument, getCurrentUser } from '@/lib/hybridSupabase'

const KnowledgeUpload = ({ userRole }) => {
  const [uploadData, setUploadData] = useState({
    title: '',
    content: '',
    source_type: 'documentation',
    file_path: '',
    repository: '',
    author: '',
    tags: []
  })
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null)
  const [tagInput, setTagInput] = useState('')

  const sourceTypes = [
    { value: 'documentation', label: 'Documentation', icon: FileText },
    { value: 'code', label: 'Code', icon: Code },
    { value: 'slack', label: 'Slack Conversation', icon: MessageSquare },
    { value: 'other', label: 'Other', icon: Link }
  ]

  const handleInputChange = (e) => {
    setUploadData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !uploadData.tags.includes(tagInput.trim())) {
      setUploadData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setUploadData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    
    if (!uploadData.title.trim() || !uploadData.content.trim()) {
      setUploadStatus({ type: 'error', message: 'Title and content are required' })
      return
    }

    setIsUploading(true)
    setUploadStatus(null)

    try {
      const currentUser = await getCurrentUser()
      
      const documentData = {
        ...uploadData,
        uploaded_by: currentUser?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await addKnowledgeDocument(documentData)
      
      if (error) {
        setUploadStatus({ type: 'error', message: error.message })
      } else {
        setUploadStatus({ type: 'success', message: 'Document uploaded successfully!' })
        
        // Also send to backend for RAG processing
        try {
          const response = await fetch('http://localhost:5002/api/data/ingest/document', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: uploadData.content,
              metadata: {
                title: uploadData.title,
                source_type: uploadData.source_type,
                file_path: uploadData.file_path,
                repository: uploadData.repository,
                author: uploadData.author,
                tags: uploadData.tags,
                source_url: `supabase://knowledge_documents/${data?.[0]?.id}`
              }
            }),
          })
          
          if (response.ok) {
            setUploadStatus({ type: 'success', message: 'Document uploaded and processed for AI search!' })
          }
        } catch (backendError) {
          console.error('Backend processing error:', backendError)
          setUploadStatus({ 
            type: 'warning', 
            message: 'Document uploaded but AI processing failed. Contact admin.' 
          })
        }
        
        // Reset form
        setUploadData({
          title: '',
          content: '',
          source_type: 'documentation',
          file_path: '',
          repository: '',
          author: '',
          tags: []
        })
      }
    } catch (error) {
      setUploadStatus({ type: 'error', message: 'Upload failed. Please try again.' })
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadStatus(null)

    try {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUploadStatus({ type: 'error', message: 'File size must be less than 10MB' })
        return
      }

      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', uploadData.title || file.name.replace(/\.[^/.]+$/, ''))
      formData.append('source_type', uploadData.source_type)
      formData.append('author', uploadData.author || 'Unknown')
      formData.append('tags', uploadData.tags.join(','))

      // Upload file to backend
      const response = await fetch('http://localhost:5002/api/data/upload/file', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setUploadStatus({ type: 'success', message: result.message })
        
        // Reset form
        setUploadData({
          title: '',
          content: '',
          source_type: 'documentation',
          file_path: '',
          repository: '',
          author: '',
          tags: []
        })
        
        // Clear file input
        e.target.value = ''
      } else {
        setUploadStatus({ type: 'error', message: result.error || 'File upload failed' })
      }
    } catch (error) {
      console.error('File upload error:', error)
      setUploadStatus({ type: 'error', message: 'File upload failed. Please try again.' })
    } finally {
      setIsUploading(false)
    }
  }

  const handleTextFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadData(prev => ({
          ...prev,
          content: event.target?.result,
          title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
          file_path: file.name
        }))
      }
      reader.readAsText(file)
    }
  }

  if (userRole !== 'admin') {
    return (
      <div className="text-center p-12">
        <div className="neo-brutalism-error p-8">
          <AlertCircle className="w-16 h-16 text-white mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-4">Access Restricted</h3>
          <p className="text-white font-medium">Only administrators can upload knowledge base documents.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg border-4 border-black">
            <Upload className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Knowledge Base Upload</h2>
        </div>
        <p className="text-xl text-gray-700 font-medium">Upload documents to enhance the AI assistant's knowledge with citations</p>
      </div>

      <div className="neo-brutalism-card">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Upload New Document</h3>
          <p className="text-gray-600 font-medium">Fill in the details below to add content to the knowledge base</p>
        </div>
        
        <form onSubmit={handleUpload} className="space-y-8">
          {/* File Upload */}
          <div className="space-y-4">
            <Label htmlFor="file-upload" className="text-lg font-bold">Upload File (Optional)</Label>
            <div className="flex items-center gap-4">
              <Input
                id="file-upload"
                type="file"
                accept=".txt,.md,.json,.py,.js,.ts,.jsx,.tsx,.html,.css,.sql,.csv,.xml,.java,.cpp,.c,.h"
                onChange={handleFileUpload}
                className="neo-brutalism-input flex-1"
              />
              <Button type="button" className="neo-brutalism-button-secondary">
                <Upload className="w-5 h-5 mr-2" />
                Browse
              </Button>
            </div>
            <p className="text-sm text-gray-600 font-medium">
              Supported formats: .txt, .md, .json, .py, .js, .ts, .jsx, .tsx, .html, .css, .sql, .csv, .xml, .java, .cpp, .c, .h
            </p>
            <p className="text-xs text-gray-500 font-medium">
              Note: For PDF, Excel, and Word documents, please convert to text format first or use the text input below.
            </p>
          </div>

          {/* Document Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="title" className="text-lg font-bold">Document Title *</Label>
              <Input
                id="title"
                name="title"
                value={uploadData.title}
                onChange={handleInputChange}
                placeholder="Enter document title"
                className="neo-brutalism-input"
                required
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="source_type" className="text-lg font-bold">Source Type</Label>
              <select
                id="source_type"
                name="source_type"
                value={uploadData.source_type}
                onChange={handleInputChange}
                className="neo-brutalism-input w-full"
              >
                {sourceTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="file_path" className="text-lg font-bold">File Path</Label>
              <Input
                id="file_path"
                name="file_path"
                value={uploadData.file_path}
                onChange={handleInputChange}
                placeholder="e.g., src/components/Header.jsx"
                className="neo-brutalism-input"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="repository" className="text-lg font-bold">Repository</Label>
              <Input
                id="repository"
                name="repository"
                value={uploadData.repository}
                onChange={handleInputChange}
                placeholder="e.g., codewhisperer-frontend"
                className="neo-brutalism-input"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="author" className="text-lg font-bold">Author</Label>
            <Input
              id="author"
              name="author"
              value={uploadData.author}
              onChange={handleInputChange}
              placeholder="e.g., John Doe"
              className="neo-brutalism-input"
            />
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <Label className="text-lg font-bold">Tags</Label>
            <div className="flex gap-3">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag..."
                className="neo-brutalism-input flex-1"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button 
                type="button" 
                onClick={handleAddTag}
                className="neo-brutalism-button-secondary"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add
              </Button>
            </div>
            {uploadData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {uploadData.tags.map((tag, index) => (
                  <div key={index} className="neo-brutalism-badge flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:bg-red-500 hover:text-white rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="space-y-3">
            <Label htmlFor="content" className="text-lg font-bold">Document Content *</Label>
            <Textarea
              id="content"
              name="content"
              value={uploadData.content}
              onChange={handleInputChange}
              placeholder="Enter or paste the document content here..."
              className="neo-brutalism-input min-h-[200px] resize-y"
              required
            />
          </div>

          {/* Status Messages */}
          {uploadStatus && (
            <div className={`${
              uploadStatus.type === 'success' 
                ? 'neo-brutalism-success' 
                : uploadStatus.type === 'error' 
                  ? 'neo-brutalism-error'
                  : 'neo-brutalism-loading'
            }`}>
              <div className="flex items-center gap-3">
                {uploadStatus.type === 'success' ? (
                  <CheckCircle className="w-6 h-6 text-white" />
                ) : uploadStatus.type === 'error' ? (
                  <AlertCircle className="w-6 h-6 text-white" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-black" />
                )}
                <span className="font-bold text-lg">
                  {uploadStatus.message}
                </span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button 
              type="submit" 
              disabled={isUploading}
              className="neo-brutalism-button text-lg px-8 py-4"
              size="lg"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6 mr-2" />
                  Upload to Knowledge Base
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Info Section */}
      <div className="neo-brutalism-card bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-500 rounded-lg border-4 border-black">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">How it works</h3>
            <ul className="space-y-2 text-gray-700 font-medium">
              <li>• Uploaded documents are processed and added to the AI knowledge base</li>
              <li>• The AI will cite these documents when answering questions</li>
              <li>• Both admins and joinees can access the knowledge through chat</li>
              <li>• Documents are searchable and will appear in chat responses with citations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default KnowledgeUpload
