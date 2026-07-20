import * as kv from './kv_store.tsx';

export interface BaremeIR {
  annee: number;
  tranches: Array<{
    min: number;
    max: number | null;
    taux: number;
  }>;
  [key: string]: any;
}

class BaremesStore {
  private readonly IR_PREFIX = 'bareme_ir_';
  private readonly META_SUFFIX = '_updated';

  async getBaremesIR(): Promise<BaremeIR[]> {
    try {
      const items = await kv.getByPrefix(this.IR_PREFIX);
      return items
        .filter(item => item !== null && item !== undefined && !item.key?.endsWith(this.META_SUFFIX))
        .map(item => (item.value ?? item) as BaremeIR);
    } catch (error) {
      console.error('❌ BaremesStore.getBaremesIR() failed:', error);
      return [];
    }
  }

  async getBaremeIR(annee: number): Promise<BaremeIR | null> {
    try {
      return await kv.get(`${this.IR_PREFIX}${annee}`);
    } catch (error) {
      console.error(`❌ BaremesStore.getBaremeIR(${annee}) failed:`, error);
      return null;
    }
  }

  async storeBaremeIR(annee: number, bareme: BaremeIR): Promise<void> {
    try {
      await kv.set(`${this.IR_PREFIX}${annee}`, bareme);
      await kv.set(`${this.IR_PREFIX}${annee}${this.META_SUFFIX}`, new Date().toISOString());
    } catch (error) {
      console.error(`❌ BaremesStore.storeBaremeIR(${annee}) failed:`, error);
    }
  }

  async deleteBaremeIR(annee: number): Promise<void> {
    try {
      await kv.del(`${this.IR_PREFIX}${annee}`);
      await kv.del(`${this.IR_PREFIX}${annee}${this.META_SUFFIX}`);
    } catch (error) {
      console.error(`❌ BaremesStore.deleteBaremeIR(${annee}) failed:`, error);
    }
  }
}

export const baremesStore = new BaremesStore();
