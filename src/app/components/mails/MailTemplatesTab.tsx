import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Plus,
  Search,
  FileText,
  Trash2,
  Copy,
  Edit,
  Eye,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { MailTemplateModal } from './MailTemplateModal';
import type { MailTemplate, MailTemplateCategory } from '../../types/mail';

const CATEGORY_COLORS: Record<MailTemplateCategory, string> = {
  prospection: 'bg-blue-100 text-blue-800',
  bienvenue: 'bg-green-100 text-green-800',
  audit: 'bg-purple-100 text-purple-800',
  recommandations: 'bg-orange-100 text-orange-800',
  suivi: 'bg-cyan-100 text-cyan-800',
  relance: 'bg-yellow-100 text-yellow-800',
  administratif: 'bg-gray-100 text-gray-800',
  evenement: 'bg-pink-100 text-pink-800',
  autre: 'bg-slate-100 text-slate-800',
};

const CATEGORY_LABELS: Record<MailTemplateCategory, string> = {
  prospection: 'Prospection',
  bienvenue: 'Bienvenue',
  audit: 'Audit',
  recommandations: 'Recommandations',
  suivi: 'Suivi',
  relance: 'Relance',
  administratif: 'Administratif',
  evenement: 'Événement',
  autre: 'Autre',
};

export function MailTemplatesTab() {
  const [templates, setTemplates] = useState<MailTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<MailTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MailTemplateCategory | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<MailTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchTerm, selectedCategory]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      // TODO: Implémenter l'appel API
      // Pour le moment, templates de démonstration
      const demoTemplates: MailTemplate[] = [
        {
          id: '1',
          name: 'Premier contact prospect',
          subject: 'Bienvenue chez CoreVision - {{nom_client}}',
          body: `Bonjour {{nom_client}},\n\nJe suis ravi de vous compter parmi nos prospects chez CoreVision.\n\nNotre équipe est à votre disposition pour analyser votre situation patrimoniale et vous accompagner dans vos projets.\n\nCordialement,\n{{nom_conseiller}}`,
          category: 'prospection',
          variables: ['nom_client', 'nom_conseiller'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          usageCount: 24,
        },
        {
          id: '2',
          name: 'Confirmation rendez-vous audit',
          subject: 'Confirmation de votre rendez-vous - Audit patrimonial',
          body: `Bonjour {{nom_client}},\n\nJe vous confirme notre rendez-vous pour votre audit patrimonial le {{date_rdv}} à {{heure_rdv}}.\n\nMerci de préparer les documents suivants :\n- Derniers relevés de comptes\n- Avis d'imposition\n- Contrats d'assurance-vie\n\nÀ très bientôt,\n{{nom_conseiller}}`,
          category: 'audit',
          variables: ['nom_client', 'date_rdv', 'heure_rdv', 'nom_conseiller'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          usageCount: 18,
        },
        {
          id: '3',
          name: 'Envoi recommandations',
          subject: 'Vos recommandations patrimoniales personnalisées',
          body: `Cher(e) {{nom_client}},\n\nSuite à notre analyse approfondie, je suis heureux de vous transmettre vos recommandations patrimoniales personnalisées.\n\nVous trouverez en pièce jointe le document détaillé de {{nb_pages}} pages.\n\nJe reste à votre disposition pour échanger sur ces préconisations.\n\nCordialement,\n{{nom_conseiller}}`,
          category: 'recommandations',
          variables: ['nom_client', 'nb_pages', 'nom_conseiller'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          usageCount: 45,
        },
      ];

      setTemplates(demoTemplates);
    } catch (error) {
      console.error('Erreur lors du chargement des templates:', error);
      toast.error('Impossible de charger les templates');
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    // Trier par nombre d'utilisations
    filtered.sort((a, b) => b.usageCount - a.usageCount);

    setFilteredTemplates(filtered);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setModalOpen(true);
  };

  const handleEdit = (template: MailTemplate) => {
    setEditingTemplate(template);
    setModalOpen(true);
  };

  const handleDuplicate = async (template: MailTemplate) => {
    try {
      const newTemplate: MailTemplate = {
        ...template,
        id: Date.now().toString(),
        name: `${template.name} (copie)`,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setTemplates([newTemplate, ...templates]);
      toast.success('Template dupliqué avec succès');
    } catch (error) {
      console.error('Erreur lors de la duplication:', error);
      toast.error('Impossible de dupliquer le template');
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) {
      return;
    }

    try {
      setTemplates(templates.filter((t) => t.id !== templateId));
      toast.success('Template supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Impossible de supprimer le template');
    }
  };

  const handleSave = (template: MailTemplate) => {
    if (editingTemplate) {
      setTemplates(templates.map((t) => (t.id === template.id ? template : t)));
      toast.success('Template mis à jour avec succès');
    } else {
      setTemplates([template, ...templates]);
      toast.success('Template créé avec succès');
    }
    setModalOpen(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Rechercher un template..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleCreate} className="bg-gradient-to-r from-blue-600 to-purple-600">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau template
        </Button>
      </div>

      {/* Filtres par catégorie */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSelectedCategory('all')}
        >
          Tous ({templates.length})
        </Badge>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
          const count = templates.filter((t) => t.category === key).length;
          return (
            <Badge
              key={key}
              variant={selectedCategory === key ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(key as MailTemplateCategory)}
            >
              {label} ({count})
            </Badge>
          );
        })}
      </div>

      {/* Liste des templates */}
      {filteredTemplates.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun template trouvé</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedCategory !== 'all'
              ? 'Essayez de modifier vos filtres'
              : 'Créez votre premier template pour gagner du temps'}
          </p>
          {!searchTerm && selectedCategory === 'all' && (
            <Button onClick={handleCreate} className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Plus className="w-4 h-4 mr-2" />
              Créer un template
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className="p-6 hover:shadow-lg transition-all border-l-4"
              style={{
                borderLeftColor:
                  CATEGORY_COLORS[template.category]?.includes('blue')
                    ? '#3B82F6'
                    : CATEGORY_COLORS[template.category]?.includes('green')
                    ? '#10B981'
                    : CATEGORY_COLORS[template.category]?.includes('purple')
                    ? '#8B5CF6'
                    : CATEGORY_COLORS[template.category]?.includes('orange')
                    ? '#F97316'
                    : '#6B7280',
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    <Badge className={CATEGORY_COLORS[template.category]}>
                      {CATEGORY_LABELS[template.category]}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{template.subject}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>{template.usageCount} utilisations</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      <span>{template.variables.length} variables</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPreviewTemplate(template)}
                    title="Prévisualiser"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(template)}
                    title="Modifier"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDuplicate(template)}
                    title="Dupliquer"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(template.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de création/édition */}
      <MailTemplateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        template={editingTemplate}
        onSave={handleSave}
      />

      {/* Modal de prévisualisation */}
      {previewTemplate && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewTemplate(null)}
        >
          <Card
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">{previewTemplate.name}</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Objet</label>
                  <p className="text-gray-900 mt-1">{previewTemplate.subject}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Corps du message</label>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">{previewTemplate.body}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Variables disponibles</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {previewTemplate.variables.map((v) => (
                      <Badge key={v} variant="outline">
                        {`{{${v}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => setPreviewTemplate(null)}>Fermer</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
