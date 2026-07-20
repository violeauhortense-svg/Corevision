import * as kv from './kv_store.tsx';

export interface BaremeIR {
  annee: number;
  tranches: Array<{ min: number; max: number | null; taux: number }>;
  [key: string]: any;
}

export interface BaremeAnnuel {
  annee: number | string;
  baremeIR: any;
  baremeIFI: any;
  prelevementsSociaux: any;
  abattements: any;
}

class BaremesStore {
  private readonly IR_PREFIX = 'bareme_ir_';
  private readonly IFI_PREFIX = 'bareme_ifi_';
  private readonly PREL_SOC_PREFIX = 'prelevements_sociaux_';
  private readonly ABATT_PREFIX = 'abattements_';
  private readonly META_PREFIX = 'bareme_';
  private readonly META_SUFFIX = '_updated';

  async getBaremesIR(): Promise<BaremeIR[]> {
    try {
      const items = await kv.getByPrefix(this.IR_PREFIX);
      return items
        .filter(item => item !== null && item !== undefined && typeof item === 'object' && 'annee' in item)
        .map(item => item as BaremeIR);
    } catch (error) {
      console.error('❌ BaremesStore.getBaremesIR() failed:', error);
      return [];
    }
  }

  async getBaremesAnnee(annee: string | number): Promise<{ baremeIR: any; baremeIFI: any; prelevementsSociaux: any; abattements: any }> {
    try {
      const [baremeIR, baremeIFI, prelevementsSociaux, abattements] = await Promise.all([
        kv.get(`${this.IR_PREFIX}${annee}`),
        kv.get(`${this.IFI_PREFIX}${annee}`),
        kv.get(`${this.PREL_SOC_PREFIX}${annee}`),
        kv.get(`${this.ABATT_PREFIX}${annee}`),
      ]);
      return { baremeIR, baremeIFI, prelevementsSociaux, abattements };
    } catch (error) {
      console.error(`❌ BaremesStore.getBaremesAnnee(${annee}) failed:`, error);
      return { baremeIR: null, baremeIFI: null, prelevementsSociaux: null, abattements: null };
    }
  }

  async storeBaremesAnnee(annee: string | number, data: {
    baremeIR?: any;
    baremeIFI?: any;
    prelevementsSociaux?: any;
    abattements?: any;
  }): Promise<void> {
    try {
      const ops = [];
      if (data.baremeIR) ops.push(kv.set(`${this.IR_PREFIX}${annee}`, data.baremeIR));
      if (data.baremeIFI) ops.push(kv.set(`${this.IFI_PREFIX}${annee}`, data.baremeIFI));
      if (data.prelevementsSociaux) ops.push(kv.set(`${this.PREL_SOC_PREFIX}${annee}`, data.prelevementsSociaux));
      if (data.abattements) ops.push(kv.set(`${this.ABATT_PREFIX}${annee}`, data.abattements));
      ops.push(kv.set(`${this.META_PREFIX}${annee}${this.META_SUFFIX}`, new Date().toISOString()));
      await Promise.all(ops);
    } catch (error) {
      console.error(`❌ BaremesStore.storeBaremesAnnee(${annee}) failed:`, error);
    }
  }

  async getBaremeIR(annee: number | string): Promise<BaremeIR | null> {
    try {
      return await kv.get(`${this.IR_PREFIX}${annee}`);
    } catch (error) {
      console.error(`❌ BaremesStore.getBaremeIR(${annee}) failed:`, error);
      return null;
    }
  }

  async storeBaremeIR(annee: number | string, bareme: BaremeIR): Promise<void> {
    try {
      await kv.set(`${this.IR_PREFIX}${annee}`, bareme);
      await kv.set(`${this.META_PREFIX}${annee}${this.META_SUFFIX}`, new Date().toISOString());
    } catch (error) {
      console.error(`❌ BaremesStore.storeBaremeIR(${annee}) failed:`, error);
    }
  }

  async deleteBaremeIR(annee: number | string): Promise<void> {
    try {
      await kv.del(`${this.IR_PREFIX}${annee}`);
      await kv.del(`${this.META_PREFIX}${annee}${this.META_SUFFIX}`);
    } catch (error) {
      console.error(`❌ BaremesStore.deleteBaremeIR(${annee}) failed:`, error);
    }
  }
}

export const baremesStore = new BaremesStore();
