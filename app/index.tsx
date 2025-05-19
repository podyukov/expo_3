import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import MapView, { Marker, LongPressEvent } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { useMarkers } from '../context/MarkerContext';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import haversine from 'haversine';

export default function Index() {
  const { markers, addMarker } = useMarkers();
  const router = useRouter();
  const [userLocation, setUserLocation] = useState(null);
  const [notifiedMarkers, setNotifiedMarkers] = useState([]);
  const [notificationIds, setNotificationIds] = useState([]);

  useEffect(() => { // уведомления
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true
      })
    });

    const checkNotificationPermission = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Ошибка', 'Доступ к уведомлениям запрещён!'); }
    };

    checkNotificationPermission();
  }, []);

  useEffect(() => { // геолокация
    let locationSubscription; // хранит подписку

    const getLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync(); // запрос разрешения
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Доступ к геолокации запрещён!');
        return;
      }

      locationSubscription = await Location.watchPositionAsync({
        accuracy: Location.Accuracy.High, // высокая точность
        timeInterval: 1000, // обновления 1 секунда
        distanceInterval: 1, // обновление в 1 метр
      },
      (location) => {
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 1.0,
          longitudeDelta: 1.0,
        });
      });
      
    };

    getLocation();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove(); // удаляем подписку при размонтировании useEffect
      }
    };
  }, []);

  useEffect(() => {
    if (!userLocation || markers.length === 0) return;

    markers.forEach(async marker => {
      const distance = haversine( // считаем дистанцию
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        { latitude: marker.latitude, longitude: marker.longitude }
      );

      if (distance < 0.1 && !notifiedMarkers.includes(marker.id)) { // если расстояние меньше 100 метров (0.1 км)
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Рядом маркер!',
            body: `id: ${marker.id}`,
          },
          trigger: null,
        });
        setNotifiedMarkers((prev) => [...prev, marker.id]);
      }
      else if (distance >= 0.1 && notifiedMarkers.includes(marker.id)) { // если юзер ушёл
        if (notificationIds[marker.id]) {
          await Notifications.cancelScheduledNotificationAsync(notificationIds[marker.id]);
          setNotificationIds((prev) => {
            const newIds = { ...prev }; // создаем новый объект для обновления состояния
            delete newIds[marker.id]; // удаляем id уведомления из объекта
            return newIds; // обновляем состояние
          });
        }
        setNotifiedMarkers((prev) => prev.filter((id) => id !== marker.id)); // удаляем маркер из списка
      }
    });
  }, [userLocation]);

  const handleLongPress = (e: LongPressEvent) => {
    const newMarker = {
      id: `${Date.now()}`,
      latitude: e.nativeEvent.coordinate.latitude,
      longitude: e.nativeEvent.coordinate.longitude,
    };
    addMarker(newMarker);
  };

  const handleMarkerPress = (id: string) => {
    router.push(`/marker/${id}`);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={userLocation}
        onLongPress={handleLongPress}
        showsUserLocation={true}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            onPress={() => handleMarkerPress(marker.id)}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' }
});
