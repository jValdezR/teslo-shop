import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { use } from 'passport';
import { Socket } from 'socket.io';
import { User } from 'src/auth/entities/user.entity';
import { Repository } from 'typeorm';

interface ConnectedClients{
    [id: string]: {
        socket: Socket,
        user: User
    }
}

@Injectable()
export class MessagesWsService {

    private connectedClients: ConnectedClients = {};
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ){}

    async registerClient(client: Socket, userId: string){
        const user = await this.userRepository.findOneBy({id: userId});
        if(!user)
            throw new Error('User not found');
        if(!user.isActive) throw new Error('User not active');
        this.checkUserConnection(user)
        this.connectedClients[client.id] = {
            socket: client,
            user: user
        };
        console.log(this.connectedClients);
    }

    removeClient(clientId: string){
        delete this.connectedClients[clientId];
    }

    getConnectedClients():string[]{
        return Object.keys(this.connectedClients);
    }

    getUserbySocket(socketId:string){
        return this.connectedClients[socketId].user.fullName;
    }

    checkUserConnection(user: User){
        for (const clientId of Object.keys(this.connectedClients)) {
            const connectedClient = this.connectedClients[clientId]
            if(connectedClient.user.id === user.id)
                connectedClient.socket.disconnect();
            break;
        }
    }
}

