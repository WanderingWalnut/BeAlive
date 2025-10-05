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
    { key: 'commitments', title: 'My Bets', focusedIcon: 'chart-line', unfocusedIcon: 'chart-line' },
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
            iconColor={currentIndex === index ? '#4f46e5' : '#9ca3af'}
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
    flexDirection: 'row',
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
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
    color: '#9ca3af',
    fontSize: 10,
    marginTop: 2,
  },
  activeNavText: {
    color: '#4f46e5',
  },
});
