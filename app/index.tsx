import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, LongPressEvent } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { useMarkers } from '../context/MarkerContext';

export default function Index() {
  const { markers, addMarker } = useMarkers();
  const router = useRouter();

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
        onLongPress={handleLongPress}
        initialRegion={{
          latitude: 58.17448,
          longitude: 56.2280,
          latitudeDelta: 1.0,
          longitudeDelta: 1.0,
        }}
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
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: 'red',
    margin: 20,
    textAlign: 'center',
  },
});
