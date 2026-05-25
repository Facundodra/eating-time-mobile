import { StyleSheet, Text, View } from 'react-native';

export default function CarritoScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Mi carrito</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' },
  text: { fontSize: 18, fontWeight: '600', color: '#374151' },
});
