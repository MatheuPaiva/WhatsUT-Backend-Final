export type LastAdminRule = 'promote' | 'delete';

export class Group {
  id: string;
  name: string;
  adminsId: string[];
  members: string[];
  pendingRequests: string[];
  lastAdminRule: LastAdminRule;
}
