import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/live',
})
export class LiveGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private rooms: Map<string, Set<string>> = new Map()
  private userNames: Map<string, string> = new Map()

  handleConnection(client: Socket) {
    console.log(`[Live] Client connected: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    this.rooms.forEach((clients, courseId) => {
      if (clients.has(client.id)) {
        clients.delete(client.id)
        this.server.to(courseId).emit('viewer-count', { count: clients.size })
      }
    })
    this.userNames.delete(client.id)
    console.log(`[Live] Client disconnected: ${client.id}`)
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @MessageBody() data: { courseId: string; userName: string; role: 'instructor' | 'viewer' },
    @ConnectedSocket() client: Socket,
  ) {
    const { courseId, userName, role } = data
    client.join(courseId)
    this.userNames.set(client.id, userName || 'مشاهد')

    if (!this.rooms.has(courseId)) {
      this.rooms.set(courseId, new Set())
    }
    this.rooms.get(courseId)!.add(client.id)

    const count = this.rooms.get(courseId)!.size
    this.server.to(courseId).emit('viewer-count', { count })

    client.to(courseId).emit('user-joined', { userName, role })

    return { event: 'joined', data: { count, courseId } }
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @MessageBody() data: { courseId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { courseId } = data
    client.leave(courseId)
    this.rooms.get(courseId)?.delete(client.id)
    const count = this.rooms.get(courseId)?.size || 0
    this.server.to(courseId).emit('viewer-count', { count })
  }

  @SubscribeMessage('send-comment')
  handleComment(
    @MessageBody() data: { courseId: string; text: string; userName: string },
    @ConnectedSocket() client: Socket,
  ) {
    const comment = {
      id: Date.now().toString() + client.id.slice(-4),
      userName: data.userName || this.userNames.get(client.id) || 'مشاهد',
      text: data.text,
      timestamp: new Date().toISOString(),
      clientId: client.id,
    }
    this.server.to(data.courseId).emit('new-comment', comment)
    return { event: 'comment-sent', data: comment }
  }

  @SubscribeMessage('send-question')
  handleQuestion(
    @MessageBody() data: { courseId: string; text: string; userName: string },
    @ConnectedSocket() client: Socket,
  ) {
    const question = {
      id: Date.now().toString() + client.id.slice(-4),
      userName: data.userName || this.userNames.get(client.id) || 'مشاهد',
      text: data.text,
      timestamp: new Date().toISOString(),
      approved: false,
      answered: false,
      clientId: client.id,
    }
    this.server.to(data.courseId).emit('new-question', question)
    return { event: 'question-sent', data: question }
  }

  @SubscribeMessage('approve-question')
  handleApproveQuestion(
    @MessageBody() data: { courseId: string; questionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(data.courseId).emit('question-approved', { questionId: data.questionId })
  }

  @SubscribeMessage('answer-question')
  handleAnswerQuestion(
    @MessageBody() data: { courseId: string; questionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(data.courseId).emit('question-answered', { questionId: data.questionId })
  }

  @SubscribeMessage('dismiss-question')
  handleDismissQuestion(
    @MessageBody() data: { courseId: string; questionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(data.courseId).emit('question-dismissed', { questionId: data.questionId })
  }

  @SubscribeMessage('live-ended')
  handleLiveEnded(
    @MessageBody() data: { courseId: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`[Gateway] Live ended for course: ${data.courseId}`)
    // Broadcast to ALL in room including sender
    this.server.to(data.courseId).emit('stream-ended', {
      message: 'انتهى البث المباشر',
      timestamp: new Date().toISOString(),
    })
    return { event: 'live-ended-broadcast', data: { courseId: data.courseId } }
  }
}
