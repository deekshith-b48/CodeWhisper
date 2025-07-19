import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Users,
  BookOpen,
  Code,
  Settings
} from 'lucide-react'
import { supabase, getOnboardingTasks } from '@/lib/hybridSupabase'

const OnboardingTasksManager = ({ userRole }) => {
  const [tasks, setTasks] = useState([])
  const [editingTask, setEditingTask] = useState(null)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'general',
    required: true,
    order_index: 0,
    estimated_hours: 1,
    resources: []
  })
  const [showAddForm, setShowAddForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const categories = [
    { value: 'verification', label: 'Identity Verification', icon: Users },
    { value: 'technical', label: 'Technical Setup', icon: Code },
    { value: 'documentation', label: 'Documentation', icon: BookOpen },
    { value: 'compliance', label: 'Compliance & Security', icon: Settings }
  ]

  const predefinedTasks = [
    {
      title: 'Verify Personal ID (PID)',
      description: 'Upload and verify your government-issued personal identification document',
      category: 'verification',
      required: true,
      estimated_hours: 0.5,
      resources: ['ID Verification Guide', 'Acceptable Documents List']
    },
    {
      title: 'Verify Phone Number',
      description: 'Verify your mobile phone number through SMS verification',
      category: 'verification',
      required: true,
      estimated_hours: 0.25,
      resources: ['Phone Verification Instructions']
    },
    {
      title: 'Verify Email Address',
      description: 'Confirm your email address by clicking the verification link',
      category: 'verification',
      required: true,
      estimated_hours: 0.25,
      resources: ['Email Verification Guide']
    },
    {
      title: 'Setup Development Environment',
      description: 'Install required development tools and configure your workspace',
      category: 'technical',
      required: true,
      estimated_hours: 2,
      resources: ['Development Setup Guide', 'Required Tools List']
    },
    {
      title: 'Complete Security Training',
      description: 'Complete mandatory security awareness training and assessment',
      category: 'compliance',
      required: true,
      estimated_hours: 1.5,
      resources: ['Security Training Portal', 'Security Policies']
    }
  ]

  useEffect(() => {
    loadTasks()
  }, [])

  const addPredefinedTasks = async () => {
    setIsLoading(true)
    try {
      for (const [index, task] of predefinedTasks.entries()) {
        const taskData = {
          ...task,
          order_index: index + 1,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }
        
        const { error } = await supabase
          .from('onboarding_tasks')
          .insert([taskData])
        
        if (error) {
          console.error('Error adding predefined task:', error)
        }
      }
      await loadTasks()
    } catch (error) {
      console.error('Error adding predefined tasks:', error)
    }
    setIsLoading(false)
  }

  const loadTasks = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await getOnboardingTasks()
      if (error) {
        console.error('Error loading tasks:', error)
      } else {
        setTasks(data || [])
      }
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return

    try {
      const { data, error } = await supabase
        .from('onboarding_tasks')
        .insert([{
          ...newTask,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()

      if (error) {
        console.error('Error adding task:', error)
      } else {
        setTasks(prev => [...prev, ...data])
        setNewTask({
          title: '',
          description: '',
          category: 'general',
          required: true,
          order_index: tasks.length,
          estimated_hours: 1,
          resources: []
        })
        setShowAddForm(false)
      }
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const { data, error } = await supabase
        .from('onboarding_tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()

      if (error) {
        console.error('Error updating task:', error)
      } else {
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, ...updates } : task
        ))
        setEditingTask(null)
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const { error } = await supabase
        .from('onboarding_tasks')
        .delete()
        .eq('id', taskId)

      if (error) {
        console.error('Error deleting task:', error)
      } else {
        setTasks(prev => prev.filter(task => task.id !== taskId))
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const getCategoryIcon = (category) => {
    const categoryData = categories.find(cat => cat.value === category)
    return categoryData ? categoryData.icon : Users
  }

  const getCategoryLabel = (category) => {
    const categoryData = categories.find(cat => cat.value === category)
    return categoryData ? categoryData.label : 'General'
  }

  if (userRole !== 'admin') {
    return (
      <div className="text-center p-8">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
        <p className="text-gray-600">Only administrators can manage onboarding tasks.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Onboarding Tasks Manager</h2>
          <p className="text-gray-600">Create and manage onboarding checklists for new joinees</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={addPredefinedTasks} 
            variant="outline" 
            className="flex items-center gap-2"
            disabled={isLoading}
          >
            <CheckCircle className="w-4 h-4" />
            Add Verification Tasks
          </Button>
          <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Custom Task
          </Button>
        </div>
      </div>

      {/* Add New Task Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Add New Task
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={newTask.category}
                  onChange={(e) => setNewTask(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what needs to be done"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimated_hours">Estimated Hours</Label>
                <Input
                  id="estimated_hours"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={newTask.estimated_hours}
                  onChange={(e) => setNewTask(prev => ({ ...prev, estimated_hours: parseFloat(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order_index">Order</Label>
                <Input
                  id="order_index"
                  type="number"
                  min="0"
                  value={newTask.order_index}
                  onChange={(e) => setNewTask(prev => ({ ...prev, order_index: parseInt(e.target.value) }))}
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <input
                  id="required"
                  type="checkbox"
                  checked={newTask.required}
                  onChange={(e) => setNewTask(prev => ({ ...prev, required: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="required">Required Task</Label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddTask} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Task
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Tasks Yet</h3>
              <p className="text-gray-600">Create your first onboarding task to get started.</p>
            </CardContent>
          </Card>
        ) : (
          tasks.map((task) => {
            const CategoryIcon = getCategoryIcon(task.category)
            return (
              <Card key={task.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CategoryIcon className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold">{task.title}</h3>
                        <Badge variant={task.required ? "default" : "secondary"}>
                          {task.required ? "Required" : "Optional"}
                        </Badge>
                        <Badge variant="outline">
                          {getCategoryLabel(task.category)}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{task.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {task.estimated_hours}h estimated
                        </span>
                        <span>Order: {task.order_index}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingTask(task)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Edit Task Modal would go here - simplified for now */}
    </div>
  )
}

export default OnboardingTasksManager
