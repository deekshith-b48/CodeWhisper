import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  AlertCircle,
  Play,
  Pause,
  SkipForward,
  MessageSquare,
  Users,
  BookOpen,
  Code,
  Settings
} from 'lucide-react'
import { getUserTaskProgress, updateTaskProgress, getCurrentUser } from '@/lib/hybridSupabase'

const TaskProgress = () => {
  const [tasks, setTasks] = useState([])
  const [userProgress, setUserProgress] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [notes, setNotes] = useState('')

  const categories = {
    'verification': { label: 'Identity Verification', icon: Users, color: 'bg-orange-500' },
    'technical': { label: 'Technical Setup', icon: Code, color: 'bg-green-500' },
    'documentation': { label: 'Documentation', icon: BookOpen, color: 'bg-purple-500' },
    'compliance': { label: 'Compliance & Security', icon: Settings, color: 'bg-red-500' }
  }

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    setIsLoading(true)
    try {
      const user = await getCurrentUser()
      if (user) {
        setCurrentUser(user)
        const { data, error } = await getUserTaskProgress(user.id)
        if (error) {
          console.error('Error loading user progress:', error)
        } else {
          setUserProgress(data || [])
          // Extract unique tasks from progress data
          const uniqueTasks = data?.map(item => item.onboarding_tasks).filter(Boolean) || []
          setTasks(uniqueTasks)
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTaskProgress = (taskId) => {
    return userProgress.find(progress => progress.task_id === taskId) || {
      status: 'pending',
      notes: '',
      started_at: null,
      completed_at: null
    }
  }

  const handleUpdateTaskStatus = async (taskId, newStatus, taskNotes = '') => {
    try {
      const { error } = await updateTaskProgress(currentUser.id, taskId, newStatus, taskNotes)
      if (error) {
        console.error('Error updating task status:', error)
      } else {
        // Reload data to get updated progress
        await loadUserData()
        setSelectedTask(null)
        setNotes('')
      }
    } catch (error) {
      console.error('Error updating task status:', error)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />
      case 'skipped':
        return <SkipForward className="w-5 h-5 text-gray-600" />
      default:
        return <Circle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      'completed': { variant: 'default', label: 'Completed', className: 'bg-green-100 text-green-800' },
      'in_progress': { variant: 'default', label: 'In Progress', className: 'bg-blue-100 text-blue-800' },
      'skipped': { variant: 'secondary', label: 'Skipped', className: 'bg-gray-100 text-gray-800' },
      'pending': { variant: 'outline', label: 'Pending', className: 'bg-yellow-100 text-yellow-800' }
    }
    const config = variants[status] || variants.pending
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const calculateProgress = () => {
    if (tasks.length === 0) return 0
    const completed = userProgress.filter(p => p.status === 'completed').length
    return Math.round((completed / tasks.length) * 100)
  }

  const getRequiredTasksProgress = () => {
    const requiredTasks = tasks.filter(task => task.required)
    if (requiredTasks.length === 0) return 100
    const completedRequired = userProgress.filter(p => {
      const task = tasks.find(t => t.id === p.task_id)
      return task?.required && p.status === 'completed'
    }).length
    return Math.round((completedRequired / requiredTasks.length) * 100)
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading your tasks...</p>
      </div>
    )
  }

  const overallProgress = calculateProgress()
  const requiredProgress = getRequiredTasksProgress()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Onboarding Tasks</h2>
        <p className="text-gray-600">Complete these tasks to finish your onboarding process</p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Overall Progress</h3>
              <span className="text-2xl font-bold text-blue-600">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="mb-2" />
            <p className="text-sm text-gray-600">
              {userProgress.filter(p => p.status === 'completed').length} of {tasks.length} tasks completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Required Tasks</h3>
              <span className="text-2xl font-bold text-green-600">{requiredProgress}%</span>
            </div>
            <Progress value={requiredProgress} className="mb-2" />
            <p className="text-sm text-gray-600">
              {userProgress.filter(p => {
                const task = tasks.find(t => t.id === p.task_id)
                return task?.required && p.status === 'completed'
              }).length} of {tasks.filter(t => t.required).length} required tasks completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks by Category */}
      {Object.entries(categories).map(([categoryKey, categoryInfo]) => {
        const categoryTasks = tasks.filter(task => task.category === categoryKey)
        if (categoryTasks.length === 0) return null

        const CategoryIcon = categoryInfo.icon

        return (
          <Card key={categoryKey}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${categoryInfo.color}`}>
                  <CategoryIcon className="w-5 h-5 text-white" />
                </div>
                {categoryInfo.label}
                <Badge variant="outline">
                  {categoryTasks.length} task{categoryTasks.length !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {categoryTasks.map((task) => {
                const progress = getTaskProgress(task.id)
                return (
                  <div key={task.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(progress.status)}
                        <div>
                          <h4 className="font-semibold flex items-center gap-2">
                            {task.title}
                            {task.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          {task.estimated_hours && (
                            <p className="text-xs text-gray-500 mt-1">
                              Estimated time: {task.estimated_hours}h
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(progress.status)}
                      </div>
                    </div>

                    {/* Task Actions */}
                    <div className="flex gap-2 mt-4">
                      {progress.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                          className="flex items-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Start Task
                        </Button>
                      )}
                      {progress.status === 'in_progress' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                            className="flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Mark Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateTaskStatus(task.id, 'pending')}
                            className="flex items-center gap-2"
                          >
                            <Pause className="w-4 h-4" />
                            Pause
                          </Button>
                        </>
                      )}
                      {(progress.status === 'pending' || progress.status === 'in_progress') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTask(task)
                            setNotes(progress.notes || '')
                          }}
                          className="flex items-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Add Notes
                        </Button>
                      )}
                      {!task.required && progress.status !== 'completed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUpdateTaskStatus(task.id, 'skipped')}
                          className="flex items-center gap-2 text-gray-600"
                        >
                          <SkipForward className="w-4 h-4" />
                          Skip
                        </Button>
                      )}
                    </div>

                    {/* Show notes if they exist */}
                    {progress.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded border">
                        <p className="text-sm text-gray-700">{progress.notes}</p>
                      </div>
                    )}

                    {/* Show timestamps */}
                    {(progress.started_at || progress.completed_at) && (
                      <div className="mt-3 text-xs text-gray-500 space-y-1">
                        {progress.started_at && (
                          <p>Started: {new Date(progress.started_at).toLocaleString()}</p>
                        )}
                        {progress.completed_at && (
                          <p>Completed: {new Date(progress.completed_at).toLocaleString()}</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )
      })}

      {/* Notes Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Notes for: {selectedTask.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes or questions about this task..."
                rows={4}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleUpdateTaskStatus(selectedTask.id, 'in_progress', notes)}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Save Notes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedTask(null)
                    setNotes('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {tasks.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Tasks Assigned</h3>
            <p className="text-gray-600">Your onboarding tasks will appear here once they're set up by an administrator.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default TaskProgress
