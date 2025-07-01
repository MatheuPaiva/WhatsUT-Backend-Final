// Arquivo: src/users/entities/users.entity.ts

export class User {
  id: string;
  name: string;
  password: string;
  banned?: boolean; 
}