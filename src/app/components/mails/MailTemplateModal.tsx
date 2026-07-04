import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { X } from 'lucide-react';
import type { MailTemplate, MailTemplateCategory } from '../../types/mail';

interface MailTemplateModalProps {
  open: boolean;
  onClose: () => void;
  template: MailTemplate | null;
  onSave: (template: MailTemplate) => void;
}

const CATEGORY_OPTIONS: { value: MailTemplateCategory; label: string }[] = [
  { value: 'prospection', label: 'Prospection' },
  { value: 'bienvenue', label: 'Bienvenue' },
  { value: 'audit', label: 'Audit' },
  { value: 'recommandations', label: 'Recommandations' },
  { value: 'suivi', label: 'Suivi' },
  { value: 'relance', label: 'Relance' },
  { value: 'administratif', label: 'Administratif' },
  { value: 'evenement', label: 'Événement' },
  { value: 'autre', label: 'Autre' },
];

const COMMON_VARIABLES = [
  'nom_client',
  'prenom_client',
  'nom_conseiller',
  'prenom_conseiller',
  'date',
  'date_rdv',
  'heure_rdv',
  'telephone',
  'email',
];

export function MailTemplateModal({ open, onClose, template, onSave }: MailTemplateModalProps) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<MailTemplateCategory>('autre');
  const [variables, setVariables] = useState<string[]>([]);
  const [newVariable, setNewVariable] = useState('');

  useEffect(() => {
    if (template) {
      setName(template.name);
      setSubject(template.subject);
      setBody(template.body);
      setCategory(template.category);
      setVariables(template.variables);
    } else {
      resetForm();
    }
  }, [template, open]);

  const resetForm = () => {
    setName('');
    setSubject('');
    setBody('');
    setCategory('autre');
    setVariables([]);
    setNewVariable('');
  };

  const handleAddVariable = () => {
    const trimmed = newVariable.trim();
    if (trimmed && !variables.includes(trimmed)) {
      setVariables([...variables, trimmed]);
      setNewVariable('');
    }
  };

  const handleRemoveVariable = (variable: string) => {
    setVariables(variables.filter((v) => v !== variable));
  };

  const insertVariable = (variable: string) => {
    const textarea = document.querySelector('textarea[name="body"]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = body;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newText = before + `{{${variable}}}` + after;
      setBody(newText);

      // Repositionner le curseur
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + variable.length + 4,
          start + variable.length + 4
        );
      }, 0);
    }
  };

  const handleSave = () => {
    if (!name.trim() || !subject.trim() || !body.trim()) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const savedTemplate: MailTemplate = {
      id: template?.id || Date.now().toString(),
      name: name.trim(),
      subject: subject.trim(),
      body: body.trim(),
      category,
      variables,
      createdAt: template?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: template?.usageCount || 0,
    };

    onSave(savedTemplate);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Modifier le template' : 'Nouveau template'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Nom */}
          <div>
            <Label htmlFor="name">
              Nom du template <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Premier contact prospect"
            />
          </div>

          {/* Catégorie */}
          <div>
            <Label htmlFor="category">
              Catégorie <span className="text-red-500">*</span>
            </Label>
            <Select value={category} onValueChange={(v) => setCategory(v as MailTemplateCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Objet */}
          <div>
            <Label htmlFor="subject">
              Objet de l'email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Bienvenue chez CoreVision - {{nom_client}}"
            />
          </div>

          {/* Variables */}
          <div>
            <Label>Variables disponibles</Label>
            <p className="text-sm text-gray-600 mb-2">
              Cliquez sur une variable pour l'insérer dans le corps du message
            </p>

            {/* Variables communes */}
            <div className="flex flex-wrap gap-2 mb-3">
              {COMMON_VARIABLES.map((v) => (
                <Badge
                  key={v}
                  variant="outline"
                  className="cursor-pointer hover:bg-blue-50"
                  onClick={() => {
                    if (!variables.includes(v)) {
                      setVariables([...variables, v]);
                    }
                    insertVariable(v);
                  }}
                >
                  {`{{${v}}}`}
                </Badge>
              ))}
            </div>

            {/* Variables personnalisées */}
            {variables.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-2">Variables de ce template :</p>
                <div className="flex flex-wrap gap-2">
                  {variables.map((v) => (
                    <Badge
                      key={v}
                      className="bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200 group"
                      onClick={() => insertVariable(v)}
                    >
                      {`{{${v}}}`}
                      <X
                        className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveVariable(v);
                        }}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Ajouter une variable personnalisée */}
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter une variable personnalisée"
                value={newVariable}
                onChange={(e) => setNewVariable(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddVariable();
                  }
                }}
              />
              <Button type="button" onClick={handleAddVariable} variant="outline">
                Ajouter
              </Button>
            </div>
          </div>

          {/* Corps */}
          <div>
            <Label htmlFor="body">
              Corps du message <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="body"
              name="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Bonjour {{nom_client}},&#10;&#10;..."
              rows={12}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-2">
              Utilisez la syntaxe {`{{variable}}`} pour insérer des variables dynamiques
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-purple-600">
              {template ? 'Mettre à jour' : 'Créer le template'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
