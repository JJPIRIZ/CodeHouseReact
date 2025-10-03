export const removeDiacritics = (s="") => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
export const slugify = (s="") =>
  removeDiacritics(String(s))
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s.-]/g, "")
    .replace(/\s+/g, "-");
