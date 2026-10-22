import { useEffect, useRef, useState, useCallback } from 'react'

const SOCKET_URL = 'https://api.deveways.com'

const MAX_COMMENTS = 100
const MAX_QUESTIONS = 50

export function useLiveSocket(
  courseId: string,
  userName: string,
  role: 'instructor' | 'viewer',
  avatar = ''
) {
  const socketRef = useRef<any>(null)

  // The identity can arrive late (after the auth sync) and the socket must
  // NOT be recreated for it: recreating it re-registers every listener and can
  // leave an orphaned socket behind — which is what made every comment appear
  // twice. The values therefore live in refs and are read at emit time.
  const userNameRef = useRef(userName)
  userNameRef.current = userName
  const roleRef = useRef(role)
  roleRef.current = role
  const avatarRef = useRef(avatar)
  avatarRef.current = avatar
  const courseIdRef = useRef(courseId)
  courseIdRef.current = courseId

  // Ids of the comments/questions that were already rendered. The Set makes
  // the dedupe O(1) and independent of the currently rendered window.
  const seenCommentIdsRef = useRef<Set<string>>(new Set())
  const seenQuestionIdsRef = useRef<Set<string>>(new Set())

  const [connected, setConnected] = useState(false)
  const [viewerCount, setViewerCount] = useState(0)
  const [comments, setComments] = useState<any[]>([])
  const [questions, setQuestions] = useState<any[]>([])
  const [streamStarted, setStreamStarted] = useState(false)
  const [streamEnded, setStreamEnded] = useState(false)

  // ── Socket handlers ─────────────────────────────────────────────────────
  // Every handler is a stable useCallback, so the effect below can detach the
  // exact same function reference it attached — `socket.off(event, fn)` only
  // removes a listener when the reference matches.
  const handleConnect = useCallback(() => {
    setConnected(true)
    socketRef.current?.emit('join-room', {
      courseId: courseIdRef.current,
      userName: userNameRef.current,
      role: roleRef.current,
      avatar: avatarRef.current,
    })
  }, [])

  const handleDisconnect = useCallback(() => {
    setConnected(false)
  }, [])

  const handleViewerCount = useCallback(({ count }: { count: number }) => {
    setViewerCount(typeof count === 'number' ? count : 0)
  }, [])

  const handleNewComment = useCallback((comment: any) => {
    if (!comment) return
    const id = typeof comment.id === 'string' ? comment.id : null
    if (id) {
      const seen = seenCommentIdsRef.current
      // Already rendered → skip. This is what guarantees a comment is shown
      // EXACTLY once even when the server delivers it twice.
      if (seen.has(id)) return
      seen.add(id)
    }
    setComments(prev => {
      const next = [...prev, comment].slice(-MAX_COMMENTS)
      // The window trimmed: drop the ids that scrolled out so the set cannot
      // grow without bound.
      if (prev.length >= MAX_COMMENTS) {
        seenCommentIdsRef.current = new Set(next.map(c => c?.id).filter(Boolean))
      }
      return next
    })
  }, [])

  const handleNewQuestion = useCallback((question: any) => {
    if (!question) return
    const id = typeof question.id === 'string' ? question.id : null
    if (id) {
      const seen = seenQuestionIdsRef.current
      if (seen.has(id)) return
      seen.add(id)
    }
    setQuestions(prev => {
      const next = [question, ...prev].slice(0, MAX_QUESTIONS)
      if (prev.length >= MAX_QUESTIONS) {
        seenQuestionIdsRef.current = new Set(next.map(q => q?.id).filter(Boolean))
      }
      return next
    })
  }, [])

  const handleQuestionApproved = useCallback(({ questionId }: any) => {
    setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, approved: true } : q))
  }, [])

  const handleQuestionAnswered = useCallback(({ questionId }: any) => {
    setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, answered: true } : q))
  }, [])

  const handleQuestionDismissed = useCallback(({ questionId }: any) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId))
  }, [])

  // Viewers get notified when the instructor starts
  const handleStreamStarted = useCallback(() => {
    setStreamStarted(true)
    setStreamEnded(false)
  }, [])

  // Everyone gets notified when the stream ends
  const handleStreamEnded = useCallback(() => {
    setStreamEnded(true)
    setStreamStarted(false)
  }, [])

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
        // The API sleeps on Render's free tier: the first connection can take
        // 10-30s to wake it up, so keep retrying long enough for that instead
        // of giving up on the room after a few short attempts.
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        timeout: 30000,
      })
      socketRef.current = socket

      // Each event is subscribed EXACTLY ONCE, with a stable handler
      // reference. No other page/component subscribes to these events for the
      // same session.
      socket.on('connect', handleConnect)
      socket.on('disconnect', handleDisconnect)
      socket.on('viewer-count', handleViewerCount)
      socket.on('new-comment', handleNewComment)
      socket.on('new-question', handleNewQuestion)
      socket.on('question-approved', handleQuestionApproved)
      socket.on('question-answered', handleQuestionAnswered)
      socket.on('question-dismissed', handleQuestionDismissed)
      socket.on('stream-started', handleStreamStarted)
      socket.on('stream-ended', handleStreamEnded)
    }

    connect()

    return () => {
      cancelled = true
      const own = socket
      if (own) {
        // Detach every listener with the SAME reference used to attach it.
        own.off('connect', handleConnect)
        own.off('disconnect', handleDisconnect)
        own.off('viewer-count', handleViewerCount)
        own.off('new-comment', handleNewComment)
        own.off('new-question', handleNewQuestion)
        own.off('question-approved', handleQuestionApproved)
        own.off('question-answered', handleQuestionAnswered)
        own.off('question-dismissed', handleQuestionDismissed)
        own.off('stream-started', handleStreamStarted)
        own.off('stream-ended', handleStreamEnded)
        try { own.emit('leave-room', { courseId }) } catch {}
        own.disconnect()
      }
      socket = null
      // Only clear the shared ref if it still points at THIS effect's socket —
      // a newer effect run may already own it.
      if (socketRef.current === own) socketRef.current = null
    }
  }, [
    courseId,
    role,
    handleConnect,
    handleDisconnect,
    handleViewerCount,
    handleNewComment,
    handleNewQuestion,
    handleQuestionApproved,
    handleQuestionAnswered,
    handleQuestionDismissed,
    handleStreamStarted,
    handleStreamEnded,
  ])

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
