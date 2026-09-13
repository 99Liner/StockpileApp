import { StyleSheet, Text, View } from 'react-native';

export default function PricesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Price History</Text>

      <Text>
        Your purchase and unit-price history will go here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
});