export interface MedicinalPlant {
  id: string;
  commonName: string;
  scientificName: string;
  benefits: string[];
  preparation: string;
  imageUrl: string;
}

export interface ScanRecord {
  id: string;
  userId: string;
  plantId: string;
  plantName: string;
  confidence: number;
  timestamp: string;
  isSynced: boolean; // False if created while offline
}
