// Arquivo: frontend/src/services/api.ts

// Função auxiliar para fazer requisições à API
async function fetchApi(path: string, token: string | null, options: RequestInit = {}) {
  const headers: HeadersInit = { // Use HeadersInit para tipar corretamente
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Adiciona o token de autorização se ele existir
  if (token) {
    // TypeScript entenderá que headers pode ser indexado por string
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

  // Retorna a resposta em JSON se o corpo não estiver vazio
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    return response.json();
  }
  
  return null; // Retorna null para respostas sem corpo (ex: 204 No Content)
}

// --- Funções da API ---

// Busca todos os usuários
export const getUsers = (token: string | null) => {
  return fetchApi('/users', token);
};

// Busca os grupos do usuário logado
export const getMyGroups = (token: string | null) => {
  return fetchApi('/group/my', token);
};

// Busca as mensagens de um chat privado
export const getPrivateMessages = (userId: string, token: string | null) => {
  return fetchApi(`/chat/private/${userId}`, token);
};

// Busca as mensagens de um chat em grupo
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
    body: JSON.stringify({ menssagem: content }) // 
  });

  if (!response.ok) {
    throw new Error("Erro ao enviar mensagem privada");
  }

  return response.json(); // 
}

// Envia uma mensagem em grupo
export const sendGroupMessage = (groupId: string, menssagem: string, token: string | null) => {
  return fetchApi(`/chat/group/${groupId}`, token, {
    method: 'POST',
    body: JSON.stringify({ menssagem }), // 
  });
};

// NOVA FUNÇÃO PARA ENVIAR ARQUIVOS PRIVADOS
export async function sendPrivateFile(userId: string, fileData: FormData, token: string) {
  const response = await fetch(`http://localhost:3000/chat/private/${userId}/file`, {
      method: 'POST',
      headers: {
          // NÃO inclua 'Content-Type': 'multipart/form-data' aqui.
          // O navegador adicionará isso automaticamente com o boundary correto quando você envia um FormData.
          'Authorization': `Bearer ${token}`
      },
      body: fileData, // Passa o objeto FormData diretamente como corpo
  });

  if (!response.ok) {
      const errorData = await response.json(); // Tenta ler erro se houver
      throw new Error(errorData.message || 'Falha ao enviar arquivo.');
  }

  // A resposta do backend para o envio de arquivo é a mensagem de chat criada
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
      return response.json();
  }
  return null; // Retorna null se não houver JSON na resposta
}