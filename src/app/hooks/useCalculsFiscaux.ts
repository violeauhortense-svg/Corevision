/**
 * 🧮 HOOK PERSONNALISÉ POUR LES CALCULS FISCAUX
 * 
 * Gère les appels async aux fonctions de calcul fiscal
 * et stabilise les résultats pour éviter les boucles infinies
 */

import { useState, useEffect } from 'react';
import {
  calculerImpotRevenu,
  calculerPrelevementsSociaux,
  calculerIFI,
  type RevenuFiscal,
  type DetailCalculIR,
  type DetailCalculPS,
  type DetailCalculIFI,
} from '../services/fiscalCalculatorDynamic';

interface UseCalculsFiscauxParams {
  revenus: RevenuFiscal;
  nombreParts: number;
  patrimoineImmobilierNet?: number;
}

interface UseCalculsFiscauxResult {
  calculIR: DetailCalculIR | null;
  calculPS: DetailCalculPS | null;
  calculIFI: DetailCalculIFI | null;
  isLoading: boolean;
  error: Error | null;
}

export function useCalculsFiscaux({
  revenus,
  nombreParts,
  patrimoineImmobilierNet = 0,
}: UseCalculsFiscauxParams): UseCalculsFiscauxResult {
  const [calculIR, setCalculIR] = useState<DetailCalculIR | null>(null);
  const [calculPS, setCalculPS] = useState<DetailCalculPS | null>(null);
  const [calculIFI, setCalculIFI] = useState<DetailCalculIFI | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ✅ Calcul IR avec useEffect + async/await
  useEffect(() => {
    if (nombreParts === 0) {
      setCalculIR(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    calculerImpotRevenu(revenus, nombreParts)
      .then((result) => {
        if (!cancelled) {
          setCalculIR(result);
            TMI: result.TMI,
            impotFinal: result.impotFinal,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('❌ Erreur calcul IR:', err);
          setError(err);
          setCalculIR(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    revenus.traitementsSalairesPensions,
    revenus.revenusTNS,
    revenus.locationsMeublesNonPro,
    revenus.revenusFonciers,
    revenus.reveusValeursCapitauxMobiliers,
    revenus.plusValueMobiliere,
    nombreParts,
  ]);

  // ✅ Calcul PS avec useEffect + async/await
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    calculerPrelevementsSociaux(revenus)
      .then((result) => {
        if (!cancelled) {
          setCalculPS(result);
            total: result.prelevementsSociauxTotal,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('❌ Erreur calcul PS:', err);
          setError(err);
          setCalculPS(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    revenus.traitementsSalairesPensions,
    revenus.revenusTNS,
    revenus.locationsMeublesNonPro,
    revenus.revenusFonciers,
    revenus.reveusValeursCapitauxMobiliers,
    revenus.plusValueMobiliere,
  ]);

  // ✅ Calcul IFI avec useEffect + async/await
  useEffect(() => {
    if (!patrimoineImmobilierNet || patrimoineImmobilierNet <= 800000) {
      setCalculIFI(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    calculerIFI(patrimoineImmobilierNet, 0)
      .then((result) => {
        if (!cancelled) {
          setCalculIFI(result);
            patrimoine: patrimoineImmobilierNet,
            ifiFinal: result.ifiFinal,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('❌ Erreur calcul IFI:', err);
          setError(err);
          setCalculIFI(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [patrimoineImmobilierNet]);

  return {
    calculIR,
    calculPS,
    calculIFI,
    isLoading,
    error,
  };
}
