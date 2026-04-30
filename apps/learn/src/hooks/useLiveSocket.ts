import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

const SOCKET_URL = 'https://deve-way.onrender.com'

export function useLiveSocket(courseId: string, userName: string, role: 'instructor' | 'viewer') {
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [viewerCount, setViewerCount] = useState(0)
  const [comments, setComments] = useState<any[]>([])
  const [questions, setQuestions] = useState<any[]>([])

  useEffect(() => {
    if (!courseId) return

    const socket = io(`${SOCKET_URL}/live`, {
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('join-room', { courseId, userName, role })
    })

    socket.on('disconnect', () => setConnected(false))

    socket.on('viewer-count', ({ count }: { count: number }) => {
      setViewerCount(count)
    })

    socket.on('new-comment', (comment: any) => {
      setComments(prev => [...prev, comment].slice(-100))
    })

    socket.on('new-question', (question: any) => {
      setQuestions(prev => [question, ...prev].slice(0, 50))
    })

    socket.on('question-approved', ({ questionId }: { questionId: string }) => {
      setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, approved: true } : q))
    })

    socket.on('question-answered', ({ questionId }: { questionId: string }) => {
      setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, answered: true } : q))
    })

    socket.on('question-dismissed', ({ questionId }: { questionId: string }) => {
      setQuestions(prev => prev.filter(q => q.id !== questionId))
    })

    return () => {
      socket.emit('leave-room', { courseId })
      socket.disconnect()
    }
  }, [courseId])

  const sendComment = useCallback((text: string) => {
    socketRef.current?.emit('send-comment', { courseId, text, userName })
  }, [courseId, userName])

  const sendQuestion = useCallback((text: string) => {
    socketRef.current?.emit('send-question', { courseId, text, userName })
  }, [courseId, userName])

  const approveQuestion = useCallback((questionId: string) => {
    socketRef.current?.emit('approve-question', { courseId, questionId })
  }, [courseId])

  const answerQuestion = useCallback((questionId: string) => {
    socketRef.current?.emit('answer-question', { courseId, questionId })
  }, [courseId])

  const dismissQuestion = useCallback((questionId: string) => {
    socketRef.current?.emit('dismiss-question', { courseId, questionId })
  }, [courseId])

  return {
    connected,
    viewerCount,
    comments,
    questions,
    sendComment,
    sendQuestion,
    approveQuestion,
    answerQuestion,
    dismissQuestion,
  }
}
