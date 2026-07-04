// Storage local - remplace Supabase Storage
// Expose une interface compatible supabaseAdmin.storage pour les routes existantes

const UPLOADS_DIR = Deno.env.get("UPLOADS_DIR") ?? "/opt/corevision/uploads";
const API_BASE_URL = Deno.env.get("API_BASE_URL") ?? "https://api.corevision.fr";

try { Deno.mkdirSync(UPLOADS_DIR, { recursive: true }); } catch { /* exists */ }

function localFrom(_bucket: string) {
  return {
    upload: async (
      filePath: string,
      data: Uint8Array,
      _options?: { contentType?: string; upsert?: boolean }
    ) => {
      const fullPath = `${UPLOADS_DIR}/${filePath}`;
      const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
      try {
        await Deno.mkdir(dir, { recursive: true });
        await Deno.writeFile(fullPath, data);
        return { data: { path: filePath }, error: null };
      } catch (error) {
        return { data: null, error: { message: (error as Error).message } };
      }
    },

    createSignedUrl: async (filePath: string, _expiresIn: number) => {
      // URL servie par notre endpoint /files/
      const signedUrl = `${API_BASE_URL}/make-server-cac859af/files/${filePath}`;
      return { data: { signedUrl }, error: null };
    },

    download: async (filePath: string) => {
      try {
        const data = await Deno.readFile(`${UPLOADS_DIR}/${filePath}`);
        return { data, error: null };
      } catch (error) {
        return { data: null, error: { message: (error as Error).message } };
      }
    },

    remove: async (paths: string[]) => {
      for (const p of paths) {
        try { await Deno.remove(`${UPLOADS_DIR}/${p}`); } catch { /* ignore */ }
      }
      return { data: null, error: null };
    },

    list: async (prefix?: string) => {
      try {
        const dir = prefix ? `${UPLOADS_DIR}/${prefix}` : UPLOADS_DIR;
        const entries = [];
        for await (const entry of Deno.readDir(dir)) {
          entries.push({ name: entry.name });
        }
        return { data: entries, error: null };
      } catch {
        return { data: [], error: null };
      }
    },
  };
}

// Interface compatible supabaseAdmin pour les routes qui le reçoivent en paramètre
export const supabaseAdminCompat = {
  storage: {
    from: localFrom,
    listBuckets: async () => ({
      data: [{ name: "make-cac859af-documents" }],
      error: null,
    }),
    createBucket: async (name: string) => {
      try {
        await Deno.mkdir(`${UPLOADS_DIR}/${name}`, { recursive: true });
      } catch { /* ignore */ }
      return { data: null, error: null };
    },
  },
};

export { UPLOADS_DIR };
