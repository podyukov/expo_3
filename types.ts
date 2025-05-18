export interface MarkerData {
  id: string;
  latitude: number;
  longitude: number;
  created_at?: string;
  images: ImageData[];
}

export interface ImageData {
  id: string;
  marker_id: string;
  uri: string;
  created_at?: string;
}

export type RootStackParamList = {
  Map: undefined;
  MarkerDetails: { id: string };
};
