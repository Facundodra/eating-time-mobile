import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Brand } from '@/constants/theme';

export default function PageLoader() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Brand.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
