// Forventede fejl fra koordinatorerne, med den HTTP-status ruterne skal svare med.

export class KoordinatorFejl extends Error {
  constructor(readonly status: number, besked: string) {
    super(besked);
    this.name = "KoordinatorFejl";
  }
}
