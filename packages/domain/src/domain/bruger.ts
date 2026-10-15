// Domæne: Bruger — dig. Bevidst minimal i første omgang; præferencer,
// notifikationsindstillinger osv. kan komme til senere uden at bryde noget.

export type BrugerId = string;

export interface Bruger {
  id: BrugerId;
  navn: string;
  email: string;
  oprettetTidspunkt: string; // ISO 8601
}
