// Arquivo: frontend/src/services/api.ts

// Função auxiliar para fazer requisições à API
async function fetchApi(path: string, token: string | null, options: RequestInit = {}) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`http://localhost:3000${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Ocorreu um erro na API');
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    return response.json();
  }

  return null;
}

// --- Funções da API ---

export const getUsers = (token: string | null) => {
  return fetchApi('/users', token);
};

export const getMyGroups = (token: string | null) => {
  return fetchApi('/group/my', token);
};

export const approveMember = (groupId: string, userIdToApprove: string, token: string) => {
  return fetchApi(`/group/${groupId}/approve/${userIdToApprove}`, token, {
    method: 'PATCH',
  });
};

export const rejectMember = (groupId: string, userIdToReject: string, token: string) => {
  return fetchApi(`/group/${groupId}/reject/${userIdToReject}`, token, {
    method: 'PATCH',
  });
};

export const banMember = (groupId: string, userIdToBan: string, token: string) => {
  return fetchApi(`/group/${groupId}/ban/${userIdToBan}`, token, {
    method: 'PATCH',
  });
};


export const getPrivateMessages = (userId: string, token: string | null) => {
  return fetchApi(`/chat/private/${userId}`, token);
};

export const getGroupMessages = (groupId: string, token: string | null) => {
  return fetchApi(`/chat/group/${groupId}`, token);
};

export async function sendPrivateMessage(receiverId: string, content: string, token: string) {
  const response = await fetch(`http://localhost:3000/chat/private/${receiverId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ menssagem: content })
  });

  if (!response.ok) {
    throw new Error("Erro ao enviar mensagem privada");
  }

  return response.json();
}

export const sendGroupMessage = (groupId: string, menssagem: string, token: string | null) => {
  return fetchApi(`/chat/group/${groupId}`, token, {
    method: 'POST',
    body: JSON.stringify({ menssagem }),
  });
};

export async function sendPrivateFile(userId: string, fileData: FormData, token: string) {
  const response = await fetch(`http://localhost:3000/chat/private/${userId}/file`, {
      method: 'POST',
      headers: {
          'Authorization': `Bearer ${token}`
      },
      body: fileData,
  });

  if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Falha ao enviar arquivo.');
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
      return response.json();
  }
  return null;
}

export async function sendGroupFile(groupId: string, fileData: FormData, token: string) {
  const response = await fetch(`http://localhost:3000/chat/group/${groupId}/file`, {
      method: 'POST',
      headers: {
          'Authorization': `Bearer ${token}`
      },
      body: fileData,
  });

  if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Falha ao enviar arquivo para o grupo.');
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
      return response.json();
  }
  return null;
}

interface CreateGroupDto {
  name: string;
  adminsId: string[];
  members: string[];
  lastAdminRule?: 'promote' | 'delete';
}

export const createGroup = (token: string, groupData: CreateGroupDto) => {
  return fetchApi('/group/create', token, {
    method: 'POST',
    body: JSON.stringify(groupData),
  });
};

export const deleteGroup = (groupId: string, token: string) => {
  return fetchApi(`/group/${groupId}`, token, {
    method: 'DELETE',
  });
};

// NOVAS FUNÇÕES: Banir e Desbanir usuário
export const banUser = (userId: string, token: string) => {
  return fetchApi(`/users/ban/${userId}`, token, {
    method: 'PATCH',
  });
};

export const unbanUser = (userId: string, token: string) => {
  return fetchApi(`/users/unban/${userId}`, token, {
    method: 'PATCH',
  });
};