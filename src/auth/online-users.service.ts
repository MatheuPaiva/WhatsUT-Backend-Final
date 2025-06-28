// auth/online-users.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class OnlineUsersService {
  private onlineUsers = new Set<string>();

  addUser(userId: string) {
    this.onlineUsers.add(userId);
  }

  removeUser(userId: string) {
    this.onlineUsers.delete(userId);
  }

  isOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  getAllOnline(): string[] {
    return Array.from(this.onlineUsers);
  }
}
