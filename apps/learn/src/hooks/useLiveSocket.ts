import { useEffect, useRef, useState, useCallback } from 'react'

const SOCKET_URL = 'https://api.deveways.com'

export function useLiveSocket(
  courseId: string,
  userName: string,
  role: 'instructor' | 'viewer',
  avatar = ''
) {
  const socketRef = useRef<any>(null)
  // The display name can arrive late (after the auth sync). Keeping it in a ref
  // lets the socket join the room with the final name without recreating the
  // connection — recreating it is what used to leave an orphaned socket behind
  // and made every comment appear twice.
  const userNameRef = useRef(userName)
  userNameRef.current = userName
  const [connected, setConnected] = useState(false)
  const [viewerCount, setViewerCount] = useState(0)
  const [comments, setComments] = useState<any[]>([])
  const [questions, setQuestions] = useState<any[]>([])
  const [streamStarted, setStreamStarted] = useState(false)
  const [streamEnded, setStreamEnded] = useState(false)

  useEffect(() => {
    if (!courseId) return

    // Guard against the async connect() racing this effect's cleanup: if the
    // effect re-runs (or unmounts) while the dynamic import is still pending,
    // the cleanup below must still kill the socket that connect() is about to
    // create — otherwise an orphaned socket keeps its listeners alive and
    // every comment is appended twice.
    let cancelled = false
    let socket: any = null

    const connect = async () => {
      const { io } = await import('socket.io-client')
      if (cancelled) return
      socket = io(`${SOCKET_URL}/live`, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      })
      socketRef.current = socket

      socket.on('connect', () => {
        setConnected(true)
        socket.emit('join-room', { courseId, userName: userNameRef.current, role, avatar })
      })

      socket.on('disconnect', () => {
        setConnected(false)
      })

      socket.on('viewer-count', ({ count }: { count: number }) => {
        setViewerCount(count)
      })

      socket.on('new-comment', (comment: any) => {
        // Guard against the same comment being delivered twice (e.g. a
        // duplicated socket or a server retry): a comment is identified by its
        // id, so an id that is already in the list is ignored.
        setComments(prev => {
          if (comment?.id && prev.some(c => c?.id === comment.id)) return prev
          return [...prev, comment].slice(-100)
        })
      })

      socket.on('new-question', (question: any) => {
        setQuestions(prev => {
          if (question?.id && prev.some(q => q?.id === question.id)) return prev
          return [question, ...prev].slice(0, 50)
        })
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
        setStreamStarted(true)
        setStreamEnded(false)
      })

      // Everyone gets notified when stream ends
      socket.on('stream-ended', (data: any) => {
        setStreamEnded(true)
        setStreamStarted(false)
      })
    }

    connect()

    return () => {
      cancelled = true
      // Only clear the shared ref if it still points at THIS effect's socket —
      // a newer effect run may already own it.
      if (socketRef.current === socket) socketRef.current = null
      if (socket) {
        try { socket.emit('leave-room', { courseId }) } catch {}
        socket.disconnect()
        socket = null
      }
    }
    // `userName` is intentionally NOT a dependency: the socket (and therefore
    // every listener) is created exactly once per course/role. The display
    // name is refreshed through the effect below.
  }, [courseId, role])

  // When the display name arrives (after the auth sync) re-join the room with
  // it instead of reconnecting — reconnecting would re-register every listener.
  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !courseId) return
    if (socket.connected) {
      socket.emit('join-room', { courseId, userName, role, avatar })
    }
  }, [userName, avatar, courseId, role])

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
  }, [courseId])

  const broadcastLiveEnded = useCallback(() => {
    socketRef.current?.emit('live-ended', { courseId })
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
