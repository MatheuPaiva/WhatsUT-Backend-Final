// Arquivo: frontend/src/components/CreateGroupModal.tsx

import React, { useState } from 'react';
import { groupService, userService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Basic styles for the modal (you can integrate with ChatPage.module.css or create a new modal.module.css)
const modalStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const contentStyles: React.CSSProperties = {
  backgroundColor: '#1f2937', // gray-800
  padding: '2rem',
  borderRadius: '0.5rem',
  width: '90%',
  maxWidth: '500px',
  color: '#f9fafb', // gray-50
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const inputStyles: React.CSSProperties = {
  padding: '0.75rem',
  border: '1px solid #4b5563', // gray-600
  borderRadius: '0.375rem',
  backgroundColor: '#374151', // gray-700
  color: '#f3f4f6', // gray-100
  width: '100%',
  boxSizing: 'border-box',
};

const buttonStyles: React.CSSProperties = {
  padding: '0.75rem 1.5rem',
  borderRadius: '0.375rem',
  border: 'none',
  cursor: 'pointer',
  fontWeight: '600',
  transition: 'background-color 0.2s',
  color: 'white',
};

const primaryButtonStyles: React.CSSProperties = {
  ...buttonStyles,
  backgroundColor: '#2563eb', // blue-600
};

const secondaryButtonStyles: React.CSSProperties = {
  ...buttonStyles,
  backgroundColor: '#4b5563', // gray-600
};


interface CreateGroupModalProps {
  onClose: () => void;
  onGroupCreated: () => void;
}

export function CreateGroupModal({ onClose, onGroupCreated }: CreateGroupModalProps) {
  const { user, token } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]); // To store all users for selection
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) return;
      try {
        const usersData = await userService.getUsers(token);
        // Filter out current user from the list
        setAllUsers(usersData.filter((u: any) => u.id !== user?.id));
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setError("Não foi possível carregar a lista de usuários.");
      }
    };
    fetchUsers();
  }, [token, user]);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('O nome do grupo não pode ser vazio.');
      return;
    }
    if (!user?.id || !token) {
      setError('Usuário não autenticado.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Ensure the current user is always an admin and a member
      const initialAdmins = selectedMembers.includes(user.id) ? selectedMembers : [...selectedMembers, user.id];
      const initialMembers = selectedMembers.includes(user.id) ? selectedMembers : [...selectedMembers, user.id];


      await groupService.createGroup(token, {
        name: groupName.trim(),
        adminsId: initialAdmins,
        members: initialMembers,
        lastAdminRule: 'promote', // Default rule for now
      });

      onGroupCreated();
      onClose();
    } catch (err: any) {
      console.error("Error creating group:", err);
      setError(err.message || "Falha ao criar o grupo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId) 
        : [...prev, memberId]
    );
  };

  return (
    <div style={modalStyles}>
      <div style={contentStyles}>
        <h2>Criar Novo Grupo</h2>
        {error && <p style={{ color: '#f87171', fontSize: '0.875rem', textAlign: 'center' }}>{error}</p>}
        
        <div>
          <label htmlFor="groupName">Nome do Grupo:</label>
          <input
            type="text"
            id="groupName"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            style={inputStyles}
            disabled={isLoading}
          />
        </div>

        <div>
          <label>Adicionar Membros:</label>
          <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #4b5563', borderRadius: '0.375rem', padding: '0.5rem' }}>
            {allUsers.length === 0 ? (
              <p style={{ color: '#9ca3af' }}>Nenhum outro usuário disponível.</p>
            ) : (
              allUsers.map((u: any) => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id={`user-${u.id}`}
                    checked={selectedMembers.includes(u.id)}
                    onChange={() => handleMemberSelection(u.id)}
                    disabled={isLoading}
                  />
                  <label htmlFor={`user-${u.id}`} style={{ color: '#f3f4f6' }}>{u.name} {u.isOnline ? '(Online)' : '(Offline)'}</label>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button onClick={onClose} style={secondaryButtonStyles} disabled={isLoading}>Cancelar</button>
          <button onClick={handleCreateGroup} style={primaryButtonStyles} disabled={isLoading}>
            {isLoading ? 'Criando...' : 'Criar Grupo'}
          </button>
        </div>
      </div>
    </div>
  );
}