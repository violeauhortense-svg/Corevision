/**
 * Migration pour ajouter des emails manquants aux clients existants
 */

export const migrateClientEmails = (): void => {
  console.log('📧 Vérification des emails clients...');
  
  const userId = localStorage.getItem('user_id') || 'default-user';
  const clientsKey = `clients_${userId}`;
  const storedClients = localStorage.getItem(clientsKey);
  
  if (!storedClients) {
    console.log('ℹ️ Aucun client trouvé');
    return;
  }
  
  const clients = JSON.parse(storedClients);
  let updated = false;
  
  const updatedClients = clients.map((client: any) => {
    // Si le client n'a pas d'email, en générer un
    if (!client.email || client.email.trim() === '') {
      const generatedEmail = `${client.prenom?.toLowerCase() || 'client'}.${client.nom?.toLowerCase() || 'client'}@example.com`;
      console.log(`📧 Email généré pour ${client.prenom} ${client.nom}: ${generatedEmail}`);
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
    console.log('✅ Migration des emails terminée');
  } else {
    console.log('✅ Tous les clients ont déjà un email');
  }
};
