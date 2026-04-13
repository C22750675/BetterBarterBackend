import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Trade, TradeStatus } from './entities/trade.entity.js';
import { Message } from './entities/message.entity.js';
import { Repository } from 'typeorm';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Trade)
    private tradeRepository: Repository<Trade>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  // Fetch all trades where the user is a participant (Proposer OR Recipient)
  // AND the trade is Accepted or Completed (i.e., a chat exists)
  async getMyChats(userId: string) {
    const trades = await this.tradeRepository.find({
      where: [
        { proposerId: userId, status: TradeStatus.ACCEPTED },
        { proposerId: userId, status: TradeStatus.COMPLETED },
        { recipientId: userId, status: TradeStatus.ACCEPTED },
        { recipientId: userId, status: TradeStatus.COMPLETED },
      ],
      relations: ['proposer', 'recipient', 'messages'],
      order: { creationDate: 'DESC' },
    });

    // Transform into a simple "Chat" DTO for the frontend
    return trades.map((trade) => {
      const isProposer = trade.proposerId === userId;
      const otherUser = isProposer ? trade.recipient : trade.proposer;

      // Get last message safely
      // We use ?. in case messages is undefined (though relations should load it)
      // We sort a copy or utilize the DB order if we had fetched messages separately,
      // but here we sort in memory for simplicity on the trade list.
      const lastMsg =
        trade.messages && trade.messages.length > 0
          ? trade.messages.sort(
              (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
            )[0]
          : null;

      return {
        id: trade.id,
        otherUser: {
          id: otherUser.id,
          username: otherUser.username,
          profilePictureUrl: otherUser.profilePictureUrl,
        },
        lastMessage: lastMsg ? lastMsg.text : null,
        lastMessageTimestamp: lastMsg ? lastMsg.timestamp : null,
        tradeStatus: trade.status,
      };
    });
  }

  async getMessages(tradeId: string) {
    return this.messageRepository.find({
      where: { tradeId },
      order: { timestamp: 'ASC' },
    });
  }

  async sendMessage(tradeId: string, userId: string, text: string) {
    const trimmedText = text.trim();

    // Prevent sending empty messages if desired
    if (!trimmedText) {
      return null;
    }

    const message = this.messageRepository.create({
      tradeId,
      senderId: userId,
      text: trimmedText,
    });
    return this.messageRepository.save(message);
  }
}
