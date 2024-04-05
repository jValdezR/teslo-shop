import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { MessagesWsService } from './messages-ws.service';
import { Server, Socket } from 'socket.io';
import { NewMessageDto } from './dto/new-message.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';

@WebSocketGateway({cors: true,})
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer() wss: Server;
  constructor(
    private readonly messagesWsService: MessagesWsService,
    private readonly jwtService: JwtService
    ) {}

  handleDisconnect(client: Socket) {
    this.messagesWsService.removeClient(client.id);
    this.wss.emit('clients-updated',this.messagesWsService.getConnectedClients());
  }

  async handleConnection(client: Socket, ...args: any[]) {
    const token = client.handshake.headers.authentication as string;
    let payload:JwtPayload;
    try {
      payload = this.jwtService.verify(token);
      await this.messagesWsService.registerClient(client, payload.id);
    } catch (error) {
      client.disconnect();
      return;
    }
    this.wss.emit('clients-updated',this.messagesWsService.getConnectedClients());
  }

  @SubscribeMessage('message-from-client')
  handleMessageFromClient(client: Socket, payload:NewMessageDto){
    //! Emitir unicamente al cliente
    // client.emit('message-from-server',{
    //   fullName: 'Soy yo',
    //   message: payload.message || 'no message'
    // })

    //!Emitir a todos menos al cliente
    // client.broadcast.emit('message-from-server',{
    //     fullName: 'Soy yo',
    //     message: payload.message || 'no message'
    //   })
    //! Emitir a todos
    this.wss.emit('message-from-server',{
      fullName: this.messagesWsService.getUserbySocket(client.id),
      message: payload.message || 'no message'
    })
    

  }


}
