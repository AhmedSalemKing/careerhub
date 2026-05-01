import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/live',
  transports: ['websocket', 'polling'],
})
export class LiveGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  // roomId -> Set of socket IDs
  private rooms = new Map<string, Set<string>>()
  // socketId -> { courseId, userName, role, avatar }
  private socketMeta = new Map<string, any>()

  handleConnection(client: Socket) {
    console.log(`[Gateway] Connected: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    const meta = this.socketMeta.get(client.id)
    if (meta?.courseId) {
      const room = this.rooms.get(meta.courseId)
      if (room) {
        room.delete(client.id)
        const count = room.size
        this.server.to(meta.courseId).emit('viewer-count', { count })
        console.log(`[Gateway] ${client.id} left ${meta.courseId}, viewers: ${count}`)
      }
    }
    this.socketMeta.delete(client.id)
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @MessageBody() data: { courseId: string; userName: string; role: string; avatar?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { courseId, userName, role, avatar } = data

    // Leave any previous rooms
    const prevMeta = this.socketMeta.get(client.id)
    if (prevMeta?.courseId && prevMeta.courseId !== courseId) {
      this.rooms.get(prevMeta.courseId)?.delete(client.id)
      client.leave(prevMeta.courseId)
    }

    client.join(courseId)
    this.socketMeta.set(client.id, { courseId, userName, role, avatar })

    if (!this.rooms.has(courseId)) this.rooms.set(courseId, new Set())
    this.rooms.get(courseId)!.add(client.id)

    const count = this.rooms.get(courseId)!.size
    // Broadcast updated count to ALL in room
    this.server.to(courseId).emit('viewer-count', { count })

    console.log(`[Gateway] ${userName} (${role}) joined ${courseId}, viewers: ${count}`)

    return { event: 'joined', data: { count, courseId } }
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @MessageBody() data: { courseId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(data.courseId)
    this.rooms.get(data.courseId)?.delete(client.id)
    this.socketMeta.delete(client.id)
    const count = this.rooms.get(data.courseId)?.size || 0
    this.server.to(data.courseId).emit('viewer-count', { count })
    return { event: 'left', data: { count } }
  }

  @SubscribeMessage('send-comment')
  handleComment(
    @MessageBody() data: { courseId: string; text: string; userName: string; avatar?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const meta = this.socketMeta.get(client.id)
    const comment = {
      id: `${Date.now()}-${client.id.slice(-4)}`,
      userName: data.userName || meta?.userName || 'مشاهد',
      avatar: data.avatar || meta?.avatar || '',
      text: data.text,
      timestamp: new Date().toISOString(),
      isOwn: false,
    }
    this.server.to(data.courseId).emit('new-comment', comment)
    return { event: 'comment-sent', data: comment }
  }

  @SubscribeMessage('send-question')
  handleQuestion(
    @MessageBody() data: { courseId: string; text: string; userName: string; avatar?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const meta = this.socketMeta.get(client.id)
    const question = {
      id: `${Date.now()}-${client.id.slice(-4)}`,
      userName: data.userName || meta?.userName || 'مشاهد',
      avatar: data.avatar || meta?.avatar || '',
      text: data.text,
      timestamp: new Date().toISOString(),
      approved: false,
      answered: false,
    }
    this.server.to(data.courseId).emit('new-question', question)
    return { event: 'question-sent', data: question }
  }

  @SubscribeMessage('approve-question')
  handleApproveQuestion(
    @MessageBody() data: { courseId: string; questionId: string },
  ) {
    this.server.to(data.courseId).emit('question-approved', { questionId: data.questionId })
  }

  @SubscribeMessage('answer-question')
  handleAnswerQuestion(
    @MessageBody() data: { courseId: string; questionId: string },
  ) {
    this.server.to(data.courseId).emit('question-answered', { questionId: data.questionId })
  }

  @SubscribeMessage('dismiss-question')
  handleDismissQuestion(
    @MessageBody() data: { courseId: string; questionId: string },
  ) {
    this.server.to(data.courseId).emit('question-dismissed', { questionId: data.questionId })
  }

  // Instructor broadcasts live started
  @SubscribeMessage('live-started')
  handleLiveStarted(
    @MessageBody() data: { courseId: string; channelName: string; appId: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`[Gateway] Live started for ${data.courseId}`)
    // Broadcast to ALL viewers in room
    client.to(data.courseId).emit('stream-started', {
      courseId: data.courseId,
      channelName: data.channelName,
      appId: data.appId,
      timestamp: new Date().toISOString(),
    })
    return { event: 'live-started-ack' }
  }

  // Instructor ends live
  @SubscribeMessage('live-ended')
  handleLiveEnded(
    @MessageBody() data: { courseId: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`[Gateway] Live ended for ${data.courseId}`)
    // Broadcast to ALL in room including sender
    this.server.to(data.courseId).emit('stream-ended', {
      courseId: data.courseId,
      timestamp: new Date().toISOString(),
    })
    return { event: 'live-ended-ack' }
  }
}
