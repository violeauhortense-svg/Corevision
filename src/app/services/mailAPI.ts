import { apiBaseUrl, publicAnonKey } from '../utils/api/info';

const API_URL = `${apiBaseUrl}/make-server-cac859af`;

// ============= TEMPLATES =============

export const getMailTemplates = async () => {
  try {
    const response = await fetch(`${API_URL}/mail-templates`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération des templates mail:', error);
    throw error;
  }
};

export const saveMailTemplate = async (template: any) => {
  try {
    const response = await fetch(`${API_URL}/mail-templates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(template),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du template mail:', error);
    throw error;
  }
};

export const deleteMailTemplate = async (templateId: string) => {
  try {
    const response = await fetch(`${API_URL}/mail-templates/${templateId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la suppression du template mail:', error);
    throw error;
  }
};

// ============= CONVERSATIONS =============

export const getMailConversations = async () => {
  try {
    const response = await fetch(`${API_URL}/mail-conversations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations mail:', error);
    throw error;
  }
};

export const createMailConversation = async (conversation: any) => {
  try {
    const response = await fetch(`${API_URL}/mail-conversations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(conversation),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la création de la conversation mail:', error);
    throw error;
  }
};

export const sendMailReply = async (conversationId: string, message: any) => {
  try {
    const response = await fetch(`${API_URL}/mail-conversations/${conversationId}/reply`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la réponse mail:', error);
    throw error;
  }
};

// ============= INBOX =============

export const getInboxEmails = async () => {
  try {
    const response = await fetch(`${API_URL}/mail-inbox`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération des emails de la boîte de réception:', error);
    throw error;
  }
};

export const markEmailAsRead = async (emailId: string) => {
  try {
    const response = await fetch(`${API_URL}/mail-inbox/${emailId}/read`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors du marquage de l\'email comme lu:', error);
    throw error;
  }
};

// ============= INTERNAL MESSAGES =============

export const getInternalMessages = async () => {
  try {
    const response = await fetch(`${API_URL}/mail-internal`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération des messages internes:', error);
    throw error;
  }
};

export const sendInternalMessage = async (message: any) => {
  try {
    const response = await fetch(`${API_URL}/mail-internal`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message interne:', error);
    throw error;
  }
};

// ============= STATS =============

export const getMailStats = async () => {
  try {
    const response = await fetch(`${API_URL}/mail-stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques mail:', error);
    throw error;
  }
};
