import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { db, initDB } from '../database/schema';

const MarkerContext = createContext({});

export const MarkerProvider = ({ children }) => {
  const [markers, setMarkers] = useState([]);

  const loadMarkers = async () => {
    try {
      const markersResult = await db.getAllAsync('SELECT * FROM markers;');
      
      if (markersResult.length > 0) {
        const placeholders = markersResult.map(() => '?').join(',');
        const images = await db.getAllAsync(
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
    }
    catch (err) { Alert.alert("Ошибка", "Не удалось загрузить маркеры!"); }
  };

  const addMarker = async (marker: Omit<'images'>) => {
    try {
      await db.runAsync(
        'INSERT INTO markers (id, latitude, longitude) VALUES (?, ?, ?);',
        [marker.id, marker.latitude, marker.longitude]
      );
      await loadMarkers();
    }
    catch (err) { Alert.alert("Ошибка", "Не удалось добавить маркеры!"); }
  };

  const addImageToMarker = async (markerId: string, image) => {
    try {
      await db.runAsync(
        'INSERT INTO marker_images (id, marker_id, uri) VALUES (?, ?, ?);',
        [image.id, markerId, image.uri]
      );
      await loadMarkers();
    }
    catch (err) { Alert.alert("Ошибка", "Не удалось добавить изображение!"); }
  };

  const removeImageFromMarker = async (imageId: string) => {
    try {
      await db.runAsync(
        'DELETE FROM marker_images WHERE id = ?;',
        [imageId]
      );
      await loadMarkers();
    }
    catch (err) { Alert.alert("Ошибка", "Не удалось удалить изображение!"); }
  };

  const removeMarker = async (markerId: string) => {
    try {
      await db.runAsync(
        'DELETE FROM markers WHERE id = ?;',
        [markerId]
      );
      await loadMarkers();
    }
    catch (err) { Alert.alert("Ошибка", "Не удалось удалить маркер!"); }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        await initDB();
        await loadMarkers();
      }
      catch (err) { Alert.alert("Ошибка", "Не удалось иницилизировать базу данных!"); }
    };

    initialize();
  }, []);

  return (
    <MarkerContext.Provider value={{ 
      markers, 
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
