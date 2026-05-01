import { useEffect, useRef, useState, useCallback } from 'react'

const SOCKET_URL = 'https://deve-way.onrender.com'

export function useLiveSocket(
  courseId: string,
  userName: string,
  role: 'instructor' | 'viewer',
  avatar = ''
) {
  const socketRef = useRef<any>(null)
  const [connected, setConnected] = useState(false)
  const [viewerCount, setViewerCount] = useState(0)
  const [comments, setComments] = useState<any[]>([])
  const [questions, setQuestions] = useState<any[]>([])
  const [streamStarted, setStreamStarted] = useState(false)
  const [streamEnded, setStreamEnded] = useState(false)

  useEffect(() => {
    if (!courseId) return

    let socket: any

    const connect = async () => {
      const { io } = await import('socket.io-client')
      socket = io(`${SOCKET_URL}/live`, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      })
      socketRef.current = socket

      socket.on('connect', () => {
        setConnected(true)
        socket.emit('join-room', { courseId, userName, role, avatar })
        console.log('[Socket] Connected, joined room:', courseId)
      })

      socket.on('disconnect', () => {
        setConnected(false)
        console.log('[Socket] Disconnected')
      })

      socket.on('viewer-count', ({ count }: { count: number }) => {
        setViewerCount(count)
      })

      socket.on('new-comment', (comment: any) => {
        setComments(prev => [...prev, comment].slice(-100))
      })

      socket.on('new-question', (question: any) => {
        setQuestions(prev => [question, ...prev].slice(0, 50))
      })

      socket.on('question-approved', ({ questionId }: any) => {
        setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, approved: true } : q))
      })

      socket.on('question-answered', ({ questionId }: any) => {
        setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, answered: true } : q))
      })

      socket.on('question-dismissed', ({ questionId }: any) => {
        setQuestions(prev => prev.filter(q => q.id !== questionId))
      })

      // Viewers get notified when instructor starts
      socket.on('stream-started', (data: any) => {
        console.log('[Socket] Stream started:', data)
        setStreamStarted(true)
        setStreamEnded(false)
      })

      // Everyone gets notified when stream ends
      socket.on('stream-ended', (data: any) => {
        console.log('[Socket] Stream ended:', data)
        setStreamEnded(true)
        setStreamStarted(false)
      })
    }

    connect()

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-room', { courseId })
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [courseId, userName, role])

  const sendComment = useCallback((text: string) => {
    socketRef.current?.emit('send-comment', { courseId, text, userName, avatar })
  }, [courseId, userName, avatar])

  const sendQuestion = useCallback((text: string) => {
    socketRef.current?.emit('send-question', { courseId, text, userName, avatar })
  }, [courseId, userName, avatar])

  const approveQuestion = useCallback((questionId: string) => {
    socketRef.current?.emit('approve-question', { courseId, questionId })
  }, [courseId])

  const answerQuestion = useCallback((questionId: string) => {
    socketRef.current?.emit('answer-question', { courseId, questionId })
  }, [courseId])

  const dismissQuestion = useCallback((questionId: string) => {
    socketRef.current?.emit('dismiss-question', { courseId, questionId })
  }, [courseId])

  const broadcastLiveStarted = useCallback((channelName: string, appId: string) => {
    socketRef.current?.emit('live-started', { courseId, channelName, appId })
    console.log('[Socket] Broadcasted live-started')
  }, [courseId])

  const broadcastLiveEnded = useCallback(() => {
    socketRef.current?.emit('live-ended', { courseId })
    console.log('[Socket] Broadcasted live-ended')
  }, [courseId])

  return {
    connected,
    viewerCount,
    comments,
    questions,
    streamStarted,
    streamEnded,
    sendComment,
    sendQuestion,
    approveQuestion,
    answerQuestion,
    dismissQuestion,
    broadcastLiveStarted,
    broadcastLiveEnded,
  }
}
