import React, { createContext, useContext, useState, useEffect } from 'react';
import { ImageData, MarkerData } from '../types';
import { db, initDB } from '../database/db';

type MarkerContextType = {
  markers: MarkerData[];
  isLoading: boolean;
  error: string | null;
  addMarker: (marker: Omit<MarkerData, 'images'>) => Promise<void>;
  addImageToMarker: (markerId: string, image: ImageData) => Promise<void>;
  removeImageFromMarker: (markerId: string, imageId: string) => Promise<void>;
  removeMarker: (markerId: string) => Promise<void>;
  loadMarkers: () => Promise<void>;
};

const MarkerContext = createContext<MarkerContextType>({
  markers: [],
  isLoading: false,
  error: null,
  addMarker: async () => {},
  addImageToMarker: async () => {},
  removeImageFromMarker: async () => {},
  removeMarker: async () => {},
  loadMarkers: async () => {},
});

export const MarkerProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMarkers = async () => {
    setIsLoading(true);
    try {
      const markersResult = await db.getAllAsync<MarkerData>('SELECT * FROM markers;');
      
      if (markersResult.length > 0) {
        const placeholders = markersResult.map(() => '?').join(',');
        const images = await db.getAllAsync<ImageData>(
          `SELECT * FROM marker_images WHERE marker_id IN (${placeholders});`,
          markersResult.map(m => m.id)
        );

        const markersWithImages = markersResult.map(marker => ({
          ...marker,
          images: images.filter(img => img.marker_id === marker.id)
        }));

        setMarkers(markersWithImages);
      } else {
        setMarkers([]);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Failed to load markers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addMarker = async (marker: Omit<MarkerData, 'images'>) => {
    try {
      await db.runAsync(
        'INSERT INTO markers (id, latitude, longitude) VALUES (?, ?, ?);',
        [marker.id, marker.latitude, marker.longitude]
      );
      await loadMarkers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Failed to add marker:', err);
    }
  };

  const addImageToMarker = async (markerId: string, image: ImageData) => {
    try {
      await db.runAsync(
        'INSERT INTO marker_images (id, marker_id, uri) VALUES (?, ?, ?);',
        [image.id, markerId, image.uri]
      );
      await loadMarkers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Failed to add image:', err);
    }
  };

  const removeImageFromMarker = async (markerId: string, imageId: string) => {
    try {
      await db.runAsync(
        'DELETE FROM marker_images WHERE id = ?;',
        [imageId]
      );
      await loadMarkers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Failed to remove image:', err);
    }
  };

  const removeMarker = async (markerId: string) => {
    try {
      await db.runAsync(
        'DELETE FROM markers WHERE id = ?;',
        [markerId]
      );
      await loadMarkers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Failed to remove marker:', err);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        await initDB();
        await loadMarkers();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Database initialization failed:', err);
      }
    };

    initialize();
  }, []);

  return (
    <MarkerContext.Provider value={{ 
      markers, 
      isLoading,
      error,
      addMarker, 
      addImageToMarker, 
      removeImageFromMarker,
      removeMarker,
      loadMarkers
    }}>
      {children}
    </MarkerContext.Provider>
  );
};

export const useMarkers = () => useContext(MarkerContext);
