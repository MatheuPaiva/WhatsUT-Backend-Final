// Arquivo: src/chat/chat.repository.ts

import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Chat } from './entities/chat.entity';
import { v4 } from 'uuid';
import { parse, writeToStream } from 'fast-csv';
import { CreateChatDto } from './dto/create-chat.dto';


export const CSV_FILE_CHAT = path.resolve(__dirname, '../../data/chats.csv');
export const CSV_HEADERS_CHAT =
  'id,senderId,content,timestamp,chatType,targetId,isArquivo\n';

@Injectable()
export class ChatRepository {
  async send(message: CreateChatDto): Promise<Chat> {
    console.log("Attempting to send message:", message); // Log de depuração

    const chat: Chat = {
      ...message,
      id: v4(),
      timestamp: new Date(),
    };

    // ALTERAÇÃO CRÍTICA AQUI: Construindo um array de valores na ordem exata do CSV_HEADERS_CHAT
    const rowValues = [
      chat.id,
      chat.senderId,
      chat.content,
      chat.timestamp.toISOString(), // Garante que a data seja uma string ISO
      chat.chatType,
      chat.targetId,
      chat.isArquivo ? 'true' : 'false', // Garante que seja 'true' ou 'false' em string
    ];

    console.log("Row values to write:", rowValues); // Log de depuração

    await new Promise<void>((resolve, reject) => {
      const stream = fs.createWriteStream(CSV_FILE_CHAT, { flags: 'a' });
      writeToStream(stream, [rowValues], { // Passa o array de valores diretamente
        headers: false, // Continua false, pois o cabeçalho é gerenciado por ensureCsvFileExists
        includeEndRowDelimiter: true,
      })
        .on('error', (err) => {
          console.error("Error writing to CSV:", err);
          reject(err);
        })
        .on('finish', () => {
          console.log("Message successfully written to CSV.");
          resolve();
        });
    });

    console.log("Message saved:", chat);
    return chat;
  }

  async findPrivateChat(userA: string, userB: string): Promise<Chat[]> {
    console.log(`findPrivateChat: userA=${userA}, userB=${userB}`);
    const messages = await this.readAllMessages();
    console.log("findPrivateChat: All messages read from CSV:", messages);
    const filteredMessages = messages.filter(
      (m) => {
        const isMatch = m.chatType === 'private' &&
          ((m.senderId === userA && m.targetId === userB) ||
           (m.senderId === userB && m.targetId === userA));
        console.log(`  - Checking message: id=${m.id}, sender=${m.senderId}, target=${m.targetId}, type=${m.chatType}, isMatch=${isMatch}`);
        return isMatch;
      }
    );
    console.log("findPrivateChat: Filtered messages:", filteredMessages);
    return filteredMessages;
  }

  async findGroupChat(groupId: string): Promise<Chat[]> {
    console.log(`findGroupChat: groupId=${groupId}`);
    const messages = await this.readAllMessages();
    console.log("findGroupChat: All messages read from CSV:", messages);
    const filteredMessages = messages.filter(
      (m) => {
        const isMatch = m.chatType === 'group' && m.targetId === groupId;
        console.log(`  - Checking message: id=${m.id}, sender=${m.senderId}, target=${m.targetId}, type=${m.chatType}, isMatch=${isMatch}`);
        return isMatch;
      }
    );
    console.log("findGroupChat: Filtered messages:", filteredMessages);
    return filteredMessages;
  }

  private async readAllMessages(): Promise<Chat[]> {
    return new Promise((resolve, reject) => {
      const results: Chat[] = [];
      fs.createReadStream(CSV_FILE_CHAT)
        .pipe(parse({ headers: true }))
        .on('error', (err) => {
          console.error("Error parsing CSV:", err);
          reject(err);
        })
        .on('data', (row) => {
          console.log("readAllMessages: Raw row data from CSV:", row); // Log a linha completa

          // ADICIONAR ESTE LOG PARA CONTEÚDO DE ARQUIVO:
          if (row.isArquivo === 'true') {
              console.log("readAllMessages: Content for file message (isArquivo=true):", row.content);
          }

          results.push({
            id: row.id,
            senderId: row.senderId,
            content: row.content,
            timestamp: new Date(row.timestamp),
            chatType: row.chatType as 'private' | 'group',
            targetId: row.targetId,
            isArquivo: row.isArquivo === 'true',
          });
        })
        .on('end', () => {
          console.log("readAllMessages: Finished reading. Total messages:", results.length);
          resolve(results);
        });
    });
  }
}