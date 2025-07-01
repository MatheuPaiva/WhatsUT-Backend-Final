// Função auxiliar para fazer requisições à API
async function fetchApi(path: string, token: string | null, options: RequestInit = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
  
    // Adiciona o token de autorização se ele existir
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
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

  export const sendPrivateMessage = (userId: string, menssagem: string, token: string | null) => {
    return fetchApi(`/chat/private/${userId}`, token, {
      method: 'POST',
      body: JSON.stringify({ menssagem }),
    });
  };
  
  // Envia uma mensagem em grupo
  export const sendGroupMessage = (groupId: string, menssagem: string, token: string | null) => {
    return fetchApi(`/chat/group/${groupId}`, token, {
      method: 'POST',
      body: JSON.stringify({ menssagem }),
    });
  };