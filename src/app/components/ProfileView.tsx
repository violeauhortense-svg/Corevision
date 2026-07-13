import { useState, useEffect } from 'react';
import { User, Mail, Shield, LogOut, Trash2, Phone, MapPin, Building, FileText, Edit, Save, X, Award, Calendar, Briefcase, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { ServerDiagnostic } from './ServerDiagnostic';

interface ProfileViewProps {
  session: any;
  onLogout: () => void;
}

interface ProfileData {
  // Informations personnelles
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  
  // Coordonnées professionnelles
  companyName: string;
  companyAddress: string;
  companyCity: string;
  companyPostalCode: string;
  companyPhone: string;
  companyEmail: string;
  
  // Habilitations
  oriasNumber: string;
  oriasDate: string;
  iasNumber: string;
  iasDate: string;
  cciNumber: string;
  cciDate: string;
  
  // Autres informations professionnelles
  profession: string;
  siretNumber: string;
  rcsNumber: string;
  professionalInsurance: string;
  insuranceCompany: string;
}

export function ProfileView({ session, onLogout }: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: session?.user?.email || '',
    phone: '',
    birthDate: '',
    
    companyName: '',
    companyAddress: '',
    companyCity: '',
    companyPostalCode: '',
    companyPhone: '',
    companyEmail: '',
    
    oriasNumber: '',
    oriasDate: '',
    iasNumber: '',
    iasDate: '',
    cciNumber: '',
    cciDate: '',
    
    profession: 'Conseiller en Gestion de Patrimoine',
    siretNumber: '',
    rcsNumber: '',
    professionalInsurance: '',
    insuranceCompany: '',
  });

  const [tempProfileData, setTempProfileData] = useState<ProfileData>(profileData);

  // Charger les données du profil depuis localStorage
  useEffect(() => {
    const userId = session?.user?.id || 'default';
    const storedProfile = localStorage.getItem(`profile_${userId}`);
    
    if (storedProfile) {
      const parsed = JSON.parse(storedProfile);
      setProfileData(parsed);
      setTempProfileData(parsed);
    } else {
      // Essayer de charger depuis profile_default (pour compatibilité)
      const defaultProfile = localStorage.getItem(`profile_default`);
      if (defaultProfile) {
        const parsed = JSON.parse(defaultProfile);
        setProfileData(parsed);
        setTempProfileData(parsed);
        // Sauvegarder aussi avec le userId pour la prochaine fois
        localStorage.setItem(`profile_${userId}`, defaultProfile);
      } else {
        // Initialiser avec l'email de la session
        const initialData = {
          ...profileData,
          email: session?.user?.email || '',
          firstName: session?.user?.user_metadata?.name?.split(' ')[0] || '',
          lastName: session?.user?.user_metadata?.name?.split(' ')[1] || '',
        };
        setProfileData(initialData);
        setTempProfileData(initialData);
      }
    }
  }, [session]);

  const handleSaveProfile = () => {
    const userId = session?.user?.id || 'default';
    // Sauvegarder avec userId spécifique
    localStorage.setItem(`profile_${userId}`, JSON.stringify(tempProfileData));
    // Sauvegarder aussi dans profile_default pour le serveur
    localStorage.setItem(`profile_default`, JSON.stringify(tempProfileData));
    setProfileData(tempProfileData);
    setIsEditing(false);
    toast.success('✅ Profil mis à jour avec succès');
  };

  const handleCancelEdit = () => {
    setTempProfileData(profileData);
    setIsEditing(false);
  };

  const handleClearAllData = () => {
    if (window.confirm('⚠️ ATTENTION : Cette action supprimera TOUTES vos données (clients, tâches, rendez-vous, documents, etc.). Voulez-vous vraiment continuer ?')) {
      try {
        const userId = session?.user?.id || 'default';
        localStorage.removeItem(`clients_${userId}`);
        localStorage.removeItem(`client_tasks_${userId}`);
        localStorage.removeItem(`documents_${userId}`);
        localStorage.removeItem(`todos_${userId}`);
        localStorage.removeItem(`meetings_${userId}`);
        localStorage.removeItem(`profile_${userId}`);
        
        toast.success('✅ Toutes les données ont été supprimées');
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        console.error('Erreur lors de la suppression des données:', error);
        toast.error('Erreur lors de la suppression des données');
      }
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900">Profil</h2>
          <p className="text-gray-600 mt-2">Gérez vos informations personnelles et professionnelles</p>
        </div>
        
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Modifier le profil
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancelEdit}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
              Annuler
            </button>
            <button
              onClick={handleSaveProfile}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Enregistrer
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Carte d'en-tête avec photo */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-white/30">
              {(profileData.firstName?.[0] || session?.user?.email?.[0] || 'U').toUpperCase()}
            </div>
            <div>
              <h3 className="text-2xl font-bold">
                {profileData.firstName || profileData.lastName 
                  ? `${profileData.firstName} ${profileData.lastName}`.trim()
                  : session?.user?.user_metadata?.name || 'Utilisateur'}
              </h3>
              <p className="text-blue-100 mt-1">{profileData.profession}</p>
              <p className="text-blue-100 text-sm mt-1">{profileData.email}</p>
            </div>
          </div>
        </div>

        {/* Informations personnelles */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-2 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Informations personnelles</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              {isEditing ? (
                <input
                  type="text"
                  value={tempProfileData.firstName}
                  onChange={(e) => setTempProfileData({ ...tempProfileData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Jean"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                  {profileData.firstName || 'Non renseigné'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              {isEditing ? (
                <input
                  type="text"
                  value={tempProfileData.lastName}
                  onChange={(e) => setTempProfileData({ ...tempProfileData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Dupont"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                  {profileData.lastName || 'Non renseigné'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p className="px-3 py-2 bg-gray-100 rounded-lg text-gray-600">
                {profileData.email}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={tempProfileData.phone}
                  onChange={(e) => setTempProfileData({ ...tempProfileData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="06 12 34 56 78"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                  {profileData.phone || 'Non renseigné'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
              {isEditing ? (
                <input
                  type="date"
                  value={tempProfileData.birthDate}
                  onChange={(e) => setTempProfileData({ ...tempProfileData, birthDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                  {profileData.birthDate 
                    ? new Date(profileData.birthDate).toLocaleDateString('fr-FR')
                    : 'Non renseigné'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
              {isEditing ? (
                <input
                  type="text"
                  value={tempProfileData.profession}
                  onChange={(e) => setTempProfileData({ ...tempProfileData, profession: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Conseiller en Gestion de Patrimoine"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                  {profileData.profession || 'Non renseigné'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Coordonnées professionnelles */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Building className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Cabinet / Société</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Raison sociale</label>
              {isEditing ? (
                <input
                  type="text"
                  value={tempProfileData.companyName}
                  onChange={(e) => setTempProfileData({ ...tempProfileData, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Cabinet Dupont Patrimoine"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                  {profileData.companyName || 'Non renseigné'}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              {isEditing ? (
                <input
                  type="text"
                  value={tempProfileData.companyAddress}
                  onChange={(e) => setTempProfileData({ ...tempProfileData, companyAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="15 Rue de la République"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                  {profileData.companyAddress || 'Non renseigné'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
              {isEditing ? (
                <input
                  type="text"
                  value={tempProfileData.companyPostalCode}
                  onChange={(e) => setTempProfileData({ ...tempProfileData, companyPostalCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="75001"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                  {profileData.companyPostalCode || 'Non renseigné'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
              {isEditing ? (
                <input
                  type="text"
                  value={tempProfileData.companyCity}
                  onChange={(e) => setTempProfileData({ ...tempProfileData, companyCity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Paris"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                  {profileData.companyCity || 'Non renseigné'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone cabinet</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={tempProfileData.companyPhone}
                  onChange={(e) => setTempProfileData({ ...tempProfileData, companyPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="01 23 45 67 89"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                  {profileData.companyPhone || 'Non renseigné'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email cabinet</label>
              {isEditing ? (
                <input
                  type="email"
                  value={tempProfileData.companyEmail}
                  onChange={(e) => setTempProfileData({ ...tempProfileData, companyEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="contact@cabinet-patrimoine.fr"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                  {profileData.companyEmail || 'Non renseigné'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro SIRET</label>
              {isEditing ? (
                <input
                  type="text"
                  value={tempProfileData.siretNumber}
                  onChange={(e) => setTempProfileData({ ...tempProfileData, siretNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123 456 789 00012"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                  {profileData.siretNumber || 'Non renseigné'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro RCS</label>
              {isEditing ? (
                <input
                  type="text"
                  value={tempProfileData.rcsNumber}
                  onChange={(e) => setTempProfileData({ ...tempProfileData, rcsNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="RCS Paris 123 456 789"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                  {profileData.rcsNumber || 'Non renseigné'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Habilitations professionnelles */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-100 p-2 rounded-lg">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Habilitations professionnelles</h3>
          </div>
          
          <div className="space-y-4">
            {/* ORIAS */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900 mb-3">ORIAS (Conseiller en Investissements Financiers)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numéro ORIAS</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={tempProfileData.oriasNumber}
                      onChange={(e) => setTempProfileData({ ...tempProfileData, oriasNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="12 345 678"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-white rounded-lg text-gray-900">
                      {profileData.oriasNumber || 'Non renseigné'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date d'habilitation</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={tempProfileData.oriasDate}
                      onChange={(e) => setTempProfileData({ ...tempProfileData, oriasDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-white rounded-lg text-gray-900">
                      {profileData.oriasDate 
                        ? new Date(profileData.oriasDate).toLocaleDateString('fr-FR')
                        : 'Non renseigné'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* IAS */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-3">IAS (Intermédiaire en Assurance)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numéro IAS</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={tempProfileData.iasNumber}
                      onChange={(e) => setTempProfileData({ ...tempProfileData, iasNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="12 345 678"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-white rounded-lg text-gray-900">
                      {profileData.iasNumber || 'Non renseigné'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date d'habilitation</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={tempProfileData.iasDate}
                      onChange={(e) => setTempProfileData({ ...tempProfileData, iasDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-white rounded-lg text-gray-900">
                      {profileData.iasDate 
                        ? new Date(profileData.iasDate).toLocaleDateString('fr-FR')
                        : 'Non renseigné'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* CCI */}
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-3">CCI (Carte de Transaction Immobilière)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numéro CCI</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={tempProfileData.cciNumber}
                      onChange={(e) => setTempProfileData({ ...tempProfileData, cciNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="CPI 1234 5678"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-white rounded-lg text-gray-900">
                      {profileData.cciNumber || 'Non renseigné'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date d'habilitation</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={tempProfileData.cciDate}
                      onChange={(e) => setTempProfileData({ ...tempProfileData, cciDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-white rounded-lg text-gray-900">
                      {profileData.cciDate 
                        ? new Date(profileData.cciDate).toLocaleDateString('fr-FR')
                        : 'Non renseigné'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Assurance professionnelle */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-medium text-amber-900 mb-3">Assurance Responsabilité Civile Professionnelle</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de police</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={tempProfileData.professionalInsurance}
                      onChange={(e) => setTempProfileData({ ...tempProfileData, professionalInsurance: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="RCP123456789"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-white rounded-lg text-gray-900">
                      {profileData.professionalInsurance || 'Non renseigné'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Compagnie d'assurance</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={tempProfileData.insuranceCompany}
                      onChange={(e) => setTempProfileData({ ...tempProfileData, insuranceCompany: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="AXA, Allianz, etc."
                    />
                  ) : (
                    <p className="px-3 py-2 bg-white rounded-lg text-gray-900">
                      {profileData.insuranceCompany || 'Non renseigné'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Informations de connexion */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Shield className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Connexion et sécurité</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700">Email de connexion</div>
                <div className="text-sm text-gray-600">{session?.user?.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700">ID Utilisateur</div>
                <div className="text-xs text-gray-600 font-mono">{session?.user?.id}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Zone dangereuse */}
        <div className="bg-white rounded-lg border border-red-200 p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Zone dangereuse
          </h3>
          
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-medium text-red-900 mb-1">Supprimer toutes les données</h4>
                <p className="text-sm text-red-700 mb-2">
                  Supprime tous vos clients, tâches, documents et données locales. Cette action est irréversible.
                </p>
                <p className="text-xs text-red-600 italic">
                  ⚠️ Attention : Cette action ne peut pas être annulée !
                </p>
              </div>
              <button
                onClick={handleClearAllData}
                className="ml-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition-colors text-sm font-medium whitespace-nowrap"
              >
                <Trash2 className="w-4 h-4" />
                Tout supprimer
              </button>
            </div>
          </div>
        </div>

        {/* Diagnostic Serveur */}
        <ServerDiagnostic />

        {/* Bouton déconnexion */}
        <button
          onClick={onLogout}
          className="w-full px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg flex items-center justify-center gap-2 transition-colors font-medium"
        >
          <LogOut className="w-5 h-5" />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
