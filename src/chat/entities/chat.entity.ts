export class Chat {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  chatType: 'private' | 'group';
  targetId: string;
  isArquivo?: boolean;
}
