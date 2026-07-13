import { useState } from 'react';
import { CheckCircle, Circle, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { PIPELINE_TASKS, getNextStage } from '../utils/pipelineTasks';
import { toast } from 'sonner';

interface ClientTask {
  id: string;
  client_id: string;
  task_id: string;
  titre: string;
  completed: boolean;
  derStatus?: {  // ✅ Ajouter le support pour derStatus
    emailSent?: boolean;
    emailSentDate?: string;
    clientSigned?: boolean;
    clientSignedDate?: string;
    spouseSigned?: boolean;
    spouseSignedDate?: string;
    hasSpouse?: boolean;
  };
  description?: string; // ✅ Ajouter la description
}

interface Client {
  id: string;
  nom: string;
  prenom: string;
  statut: string;
  patrimoine: number;
}

interface PipelineClientCardProps {
  client: Client;
  tasks: ClientTask[];
  onTaskToggle: (clientId: string, taskId: string, completed: boolean) => void;
  onClientStageChange: (clientId: string, newStage: string) => void;
}

export function PipelineClientCard({ client, tasks, onTaskToggle, onClientStageChange }: PipelineClientCardProps) {
  return (
    <div className="bg-white bg-opacity-70 rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow">
      {/* Nom et prénom uniquement */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate text-sm">
            {client.prenom} {client.nom}
          </div>
        </div>
      </div>
    </div>
  );
}
