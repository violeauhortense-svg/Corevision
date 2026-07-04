/**
 * 📊 VUE - ADMINISTRATION DES BARÈMES FISCAUX
 * 
 * Page complète pour gérer les barèmes depuis l'application
 */

import React from 'react';
import { BaremesFiscauxAdmin } from './admin/BaremesFiscauxAdmin';

export function BaremesFiscauxView() {
  return (
    <div className="min-h-screen bg-gray-50">
      <BaremesFiscauxAdmin />
    </div>
  );
}
