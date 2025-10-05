import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

interface BottomNavigationProps {
  currentIndex: number;
  onTabPress: (key: string) => void;
}

export default function BottomNavigation({ currentIndex, onTabPress }: BottomNavigationProps) {
  const routes = [
    { key: 'home', title: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
  { key: 'commitments', title: 'Commits', focusedIcon: 'account-heart', unfocusedIcon: 'account-heart-outline' },
    { key: 'settings', title: 'Settings', focusedIcon: 'cog', unfocusedIcon: 'cog-outline' },
  ];

  return (
    <View style={styles.bottomNav}>
      {routes.map((route, index) => (
        <TouchableOpacity 
          key={route.key}
          style={[styles.navItem, currentIndex === index && styles.activeNavItem]}
          onPress={() => onTabPress(route.key)}
        >
          <IconButton
            icon={currentIndex === index ? route.focusedIcon : route.unfocusedIcon}
            size={24}
            iconColor={currentIndex === index ? '#6B8AFF' : '#9CA3AF'}
            style={styles.navIcon}
          />
          <Text style={[styles.navText, currentIndex === index && styles.activeNavText]}>
            {route.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E5ED',
    height: 64,
    paddingBottom: 12,
    paddingTop: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  activeNavItem: {
    backgroundColor: 'transparent',
  },
  navIcon: {
    margin: 0,
    width: 24,
    height: 24,
  },
  navText: {
    color: '#9CA3AF',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  activeNavText: {
    color: '#6B8AFF',
    fontWeight: '600',
  },
});
