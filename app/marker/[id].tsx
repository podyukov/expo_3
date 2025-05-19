import React from "react";
import { View, Text, Button, FlatList, Alert, Image, StyleSheet } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useMarkers } from "../../context/MarkerContext";

export default function MarkerDetails() {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params;
  const { markers, addImageToMarker, removeImageFromMarker, removeMarker } = useMarkers();

  const marker = markers.find(m => m.id === id);

  if (!marker) {
    return (
      <View style={styles.container}>
        <Text>Маркер не найден</Text>
        <Button title="Назад к карте" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const addImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled && result.assets?.length) {
        const newImage = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
          marker_id: ""
        };
        addImageToMarker(marker.id, newImage);
      }
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось выбрать изображение");
    }
  };

  const deleteImage = (imageId: string) => {
    removeImageFromMarker(imageId);
  };

  const handleDeleteMarker = () => {
    removeMarker(marker.id);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text>Маркер ID: {marker.id}</Text>
      <Text>Широта: {marker.latitude}</Text>
      <Text>Долгота: {marker.longitude}</Text>

      <Button title="Добавить изображение" onPress={addImage} />

      <FlatList
        data={marker.images}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.imageBlock}>
            <Image source={{ uri: item.uri }} style={styles.image} />
            <Button title="Удалить" onPress={() => deleteImage(item.id)} />
          </View>
        )}
      />

      <Button title="Назад к карте" onPress={() => navigation.goBack()} />
      <Button title="Удалить маркер" onPress={handleDeleteMarker} color="red" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  imageBlock: { marginVertical: 10 },
  image: { width: 200, height: 200, borderRadius: 10 }
});
