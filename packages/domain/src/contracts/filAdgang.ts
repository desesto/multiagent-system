// Fil-adgang for agenter: kontrakten og de NEUTRALE værktøjsdefinitioner.
// Neutral betyder: intet her kender til Anthropic eller andre udbydere.
// Hver runner oversætter selv til sin udbyders format (fx
// vaerktoejerAnthropic.ts), så et udbyderskift ikke rører denne fil.
//
// Første skive er KUN læsning. Skrivning kommer senere som forslag,
// brugeren skal godkende.

/** Diskrimineret union: ét medlem pr. værktøj, skelnes på `type` */
export type VaerktoejsKald =
  | { type: "list_filer"; sti: string }
  | { type: "laes_fil"; sti: string }
  | { type: "soeg"; tekst: string; sti: string };

export type VaerktoejsNavn = VaerktoejsKald["type"];

export interface VaerktoejsResultat {
  /** Teksten, agenten får tilbage */
  tekst: string;
  /** true = agenten får en fejlbesked, men kørslen fortsætter */
  fejl: boolean;
  /** Sat når en fil faktisk blev læst — bruges til revisionssporet */
  laestFil?: string;
}

export interface VaerktoejsParameter {
  navn: string;
  beskrivelse: string;
  paakraevet: boolean;
}

export interface VaerktoejsDefinition {
  navn: VaerktoejsNavn;
  beskrivelse: string;
  parametre: VaerktoejsParameter[];
}

export const VAERKTOEJER: VaerktoejsDefinition[] = [
  {
    navn: "list_filer",
    beskrivelse:
      "Lister filer og mapper rekursivt fra en mappe i projektet. Mapper slutter med /.",
    parametre: [
      {
        navn: "sti",
        beskrivelse: 'Relativ sti i projektet, fx "." eller "src"',
        paakraevet: true,
      },
    ],
  },
  {
    navn: "laes_fil",
    beskrivelse: "Læser indholdet af én tekstfil i projektet.",
    parametre: [
      {
        navn: "sti",
        beskrivelse: 'Relativ sti til filen, fx "src/server.ts"',
        paakraevet: true,
      },
    ],
  },
  {
    navn: "soeg",
    beskrivelse:
      "Søger efter en tekst (ikke case-følsom) i projektets filer og returnerer fil:linje-træf.",
    parametre: [
      { navn: "tekst", beskrivelse: "Teksten der søges efter", paakraevet: true },
      {
        navn: "sti",
        beskrivelse: 'Mappe der søges i, fx "." for hele projektet',
        paakraevet: true,
      },
    ],
  },
];

export interface SoegeTraef {
  sti: string;
  linje: number;
  tekst: string;
}

/**
 * Læseadgang til ÉT projekt. Implementeringer SKAL håndhæve:
 * kun inden for projektroden, aldrig forbudte filer (.env, .git,
 * node_modules), og loft over filstørrelse. Overtrædelser kastes som
 * FilAdgangsFejl — dispatcheren gør dem til bløde fejlresultater.
 */
export interface IFilAdgang {
  listFiler(sti: string): Promise<string[]>;
  laesFil(sti: string): Promise<string>;
  soeg(tekst: string, sti: string): Promise<SoegeTraef[]>;
}

/** Laver fil-adgang pr. opgave og validerer projektstier ved indtastning */
export interface IFilAdgangFabrik {
  /** Returnerer en fejlbesked, eller null hvis stien er gyldig */
  valider(projektSti: string): Promise<string | null>;
  forProjekt(projektSti: string): IFilAdgang;
}

/** Forventede, "pæne" fejl — fx forbudt sti eller binær fil */
export class FilAdgangsFejl extends Error {
  constructor(besked: string) {
    super(besked);
    this.name = "FilAdgangsFejl";
  }
}
