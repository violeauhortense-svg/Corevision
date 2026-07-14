/**
 * Migration pour ajouter des emails manquants aux clients existants
 */

export const migrateClientEmails = (): void => {
  
  const userId = localStorage.getItem('user_id') || 'default-user';
  const clientsKey = `clients_${userId}`;
  const storedClients = localStorage.getItem(clientsKey);
  
  if (!storedClients) {
    return;
  }
  
  const clients = JSON.parse(storedClients);
  let updated = false;
  
  const updatedClients = clients.map((client: any) => {
    // Si le client n'a pas d'email, en générer un
    if (!client.email || client.email.trim() === '') {
      const generatedEmail = `${client.prenom?.toLowerCase() || 'client'}.${client.nom?.toLowerCase() || 'client'}@example.com`;
      updated = true;
      return {
        ...client,
        email: generatedEmail,
      };
    }
    return client;
  });
  
  if (updated) {
    localStorage.setItem(clientsKey, JSON.stringify(updatedClients));
  } else {
  }
};
