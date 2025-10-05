import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function FloatingButton() {
  const navigation = useNavigation();

  return (
    <TouchableOpacity 
      style={styles.floatingButton}
      onPress={() => navigation.navigate('ChallengeCreation' as never)}
      activeOpacity={0.8}
    >
      <Text style={styles.floatingButtonText}>+</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#4f46e5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  floatingButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
});
