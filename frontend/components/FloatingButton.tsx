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
    backgroundColor: '#6B8AFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 8,
    shadowColor: '#6B8AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  floatingButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
