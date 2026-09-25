// Barèmes fiscaux (IR, IFI, prélèvements sociaux, abattements) - un
// enregistrement PocketBase par année dans la collection `baremes_fiscaux`.
// Alimente à la fois le panneau d'admin (BaremesFiscauxAdmin.tsx) et le
// calcul réel d'impôt de chaque client (fiscalCalculatorDynamic.ts).
//
// Mounted at the app root (not under /api) to match the paths the
// frontend already calls: `${apiBaseUrl}/baremes/:annee`.

import { Hono } from 'hono';
import { pb } from './pocketbase_client.tsx';

const app = new Hono();

// Source : service-public.fr / impots.gouv.fr, barème 2025 (dernier
// barème officiel connu au moment de l'écriture) - utilisé uniquement
// pour amorcer une année qui n'a encore aucun enregistrement, ou pour
// la réinitialisation explicite depuis le panneau admin.
const DEFAULT_BAREMES = {
  baremeIR: [
    { min: 0, max: 11600, taux: 0, label: 'Tranche 1 : 0%' },
    { min: 11600, max: 29579, taux: 0.11, label: 'Tranche 2 : 11%' },
    { min: 29579, max: 84577, taux: 0.30, label: 'Tranche 3 : 30%' },
    { min: 84577, max: 181917, taux: 0.41, label: 'Tranche 4 : 41%' },
    { min: 181917, max: null, taux: 0.45, label: 'Tranche 5 : 45%' },
  ],
  baremeIFI: [
    { min: 0, max: 800000, taux: 0, label: 'Exonération' },
    { min: 800000, max: 1300000, taux: 0.005, label: '0,5%' },
    { min: 1300000, max: 2570000, taux: 0.007, label: '0,7%' },
    { min: 2570000, max: 5000000, taux: 0.01, label: '1%' },
    { min: 5000000, max: 10000000, taux: 0.0125, label: '1,25%' },
    { min: 10000000, max: null, taux: 0.015, label: '1,5%' },
  ],
  prelevementsSociaux: {
    CSG: 0.092,
    CRDS: 0.005,
    PRELEVEMENT_SOLIDARITE: 0.075,
    TOTAL: 0.172,
  },
  abattements: {
    abattement10PourcentPlafond: 13522,
    abattement10PourcentPlancher: 472,
    decoteCelibatairePlafond: 1929,
    decoteCouplePlafond: 3191,
    decoteCelibataireMax: 873,
    decoteCoupleMax: 1444,
    microFoncierPlafond: 15000,
    microFoncierAbattement: 0.30,
  },
};

async function findByAnnee(annee: string) {
  const { items } = await pb.listRecords('baremes_fiscaux', {
    filter: `annee = "${annee}"`,
    perPage: 1,
  });
  return items[0] || null;
}

function toResponse(record: any) {
  return {
    annee: record.annee,
    baremeIR: record.baremeIR,
    baremeIFI: record.baremeIFI,
    prelevementsSociaux: record.prelevementsSociaux,
    abattements: record.abattements,
    updated: record.updated,
  };
}

// GET /:annee - lit le barème de l'année ; l'amorce avec les valeurs par
// défaut s'il n'existe pas encore (première utilisation de cette année).
app.get('/:annee', async (c) => {
  const annee = c.req.param('annee');
  try {
    let record = await findByAnnee(annee);
    if (!record) {
      record = await pb.createRecord('baremes_fiscaux', { annee, ...DEFAULT_BAREMES });
    }
    return c.json(toResponse(record));
  } catch (err: any) {
    console.error('Erreur lecture barèmes:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// PUT /:annee - enregistre les valeurs modifiées depuis le panneau admin.
app.put('/:annee', async (c) => {
  const annee = c.req.param('annee');
  try {
    const body = await c.req.json();
    const payload = {
      annee,
      baremeIR: body.baremeIR,
      baremeIFI: body.baremeIFI,
      prelevementsSociaux: body.prelevementsSociaux,
      abattements: body.abattements,
    };

    const existing = await findByAnnee(annee);
    const record = existing
      ? await pb.updateRecord('baremes_fiscaux', existing.id, payload)
      : await pb.createRecord('baremes_fiscaux', payload);

    return c.json({ success: true, ...toResponse(record) });
  } catch (err: any) {
    console.error('Erreur sauvegarde barèmes:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// POST /:annee/reinitialiser - remplace le barème de l'année par les
// valeurs par défaut ci-dessus.
app.post('/:annee/reinitialiser', async (c) => {
  const annee = c.req.param('annee');
  try {
    const payload = { annee, ...DEFAULT_BAREMES };
    const existing = await findByAnnee(annee);
    const record = existing
      ? await pb.updateRecord('baremes_fiscaux', existing.id, payload)
      : await pb.createRecord('baremes_fiscaux', payload);

    return c.json({ success: true, ...toResponse(record) });
  } catch (err: any) {
    console.error('Erreur réinitialisation barèmes:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

export default app;
