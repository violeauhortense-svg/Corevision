// Un nom de fichier avec un caractère hors ASCII (accents, tiret
// cadratin...) fait planter `new Response(..., { headers })` - les valeurs
// d'en-têtes HTTP doivent être des ByteString, et Deno lève "Argument 2 is
// not a valid ByteString" dès qu'on y met un filename="..." contenant par
// exemple un "é" ou un "—". On fournit donc un fallback ASCII pour
// filename= et la vraie valeur encodée pour filename* (RFC 5987/6266,
// supporté par tous les navigateurs modernes).
export function contentDisposition(type: 'inline' | 'attachment', filename: string): string {
  const safeFilename = filename.replace(/"/g, '');
  const asciiFallback = safeFilename.replace(/[^\x20-\x7E]/g, '_');
  const encoded = encodeURIComponent(safeFilename);
  return `${type}; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}
