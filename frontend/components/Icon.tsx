import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

const Icon: React.FC<IconProps> = ({ name, size = 20, color = '#fff', style }) => {
  const iconMap: { [key: string]: string } = {
    // Navigation
    home: '🏠',
    bets: '📊',
    create: '➕',
    chat: '💬',
    profile: '👤',
    
    // Actions
    like: '👍',
    dislike: '👎',
    share: '↗',
    add: '👤+',
    camera: '📷',
    photo: '📸',
    
    // Status
    signal: '📶',
    battery: '🔋',
    time: '⏰',
    check: '✓',
    arrow: '›',
    back: '‹',
    
    // Settings
    user: '👤',
    phone: '📱',
    lock: '🔒',
    contacts: '👥',
    bell: '🔔',
    card: '💳',
    wallet: '💰',
    info: 'ℹ️',
    support: '📧',
    
    // Challenge
    challenge: '🎯',
    money: '💰',
    clock: '⏰',
    trophy: '🏆',
    fire: '🔥',
    
    // Social
    friends: '👥',
    invite: '📤',
    message: '💬',
  };

  return (
    <Text style={[styles.icon, { fontSize: size, color }, style]}>
      {iconMap[name] || '❓'}
    </Text>
  );
};

const styles = StyleSheet.create({
  icon: {
    textAlign: 'center',
  },
});

export default Icon;
