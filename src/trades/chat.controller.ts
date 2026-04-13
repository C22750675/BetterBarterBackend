import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/decorators/jwt-auth.guard.js';
import { GetUser } from '../auth/decorators/get-user.decorator.js';
import { User } from '../users/entities/user.entity.js';
import { ChatService } from './chat.service.js';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  getMyChats(@GetUser() user: User) {
    return this.chatService.getMyChats(user.id);
  }

  @Get(':tradeId/messages')
  getMessages(@Param('tradeId') tradeId: string) {
    return this.chatService.getMessages(tradeId);
  }

  @Post(':tradeId/messages')
  sendMessage(
    @Param('tradeId') tradeId: string,
    @Body('text') text: string,
    @GetUser() user: User,
  ) {
    return this.chatService.sendMessage(tradeId, user.id, text);
  }
}
