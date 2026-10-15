// Domæne: mappevælgeren. Serveren lister mapper, fordi browseren af
// sikkerhedsgrunde ikke må se fulde stier på disken.

export interface MappePost {
  navn: string;
  /** Absolut sti */
  sti: string;
  /** Har en .git-mappe — implementering kræver et git-repo */
  erGitRepo: boolean;
}

export interface MappeListe {
  /** Den viste mappe (absolut) */
  sti: string;
  /** Fra roden og ned til den viste mappe — til brødkrummer */
  brodkrummer: { navn: string; sti: string }[];
  /** Overmappen, eller null når vi står i roden */
  overmappe: string | null;
  mapper: MappePost[];
  /** Selve den viste mappe er et git-repo */
  erGitRepo: boolean;
}
