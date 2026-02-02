import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const GLASS_SIZE = 250; // ml
const DAILY_GOAL = 2000; // ml

export default function App() {
  const [intake, setIntake] = useState(0);
  const [goalReached, setGoalReached] = useState(false);
  const [celebrationAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    saveData();
    if (intake >= DAILY_GOAL && !goalReached) {
      setGoalReached(true);
      celebrate();
    }
  }, [intake]);

  const loadData = async () => {
    try {
      const today = new Date().toDateString();
      const savedDate = await AsyncStorage.getItem('lastReset');
      
      if (savedDate !== today) {
        // New day, reset
        await AsyncStorage.setItem('lastReset', today);
        await AsyncStorage.setItem('intake', '0');
        setIntake(0);
        setGoalReached(false);
      } else {
        const savedIntake = await AsyncStorage.getItem('intake');
        if (savedIntake) {
          const intakeValue = parseInt(savedIntake);
          setIntake(intakeValue);
          if (intakeValue >= DAILY_GOAL) {
            setGoalReached(true);
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem('intake', intake.toString());
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const addGlass = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIntake(prev => Math.min(prev + GLASS_SIZE, DAILY_GOAL + 1000)); // Cap at goal + 1L
  };

  const celebrate = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.sequence([
      Animated.timing(celebrationAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(celebrationAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const progress = Math.min(intake / DAILY_GOAL, 1);
  const glassesCount = Math.floor(intake / GLASS_SIZE);

  const celebrationScale = celebrationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💧 Water Tracker</Text>
      
      <View style={styles.statsContainer}>
        <Text style={styles.intake}>{intake}ml</Text>
        <Text style={styles.goal}>/ {DAILY_GOAL}ml</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View 
            style={[
              styles.progressFill, 
              { 
                width: `${progress * 100}%`,
                transform: [{ scale: celebrationScale }]
              }
            ]} 
          />
        </View>
        <Text style={styles.percentage}>{Math.round(progress * 100)}%</Text>
      </View>

      {goalReached && (
        <Text style={styles.congratulations}>🎉 Goal Reached! 🎉</Text>
      )}

      <TouchableOpacity 
        style={styles.button}
        onPress={addGlass}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonIcon}>💧</Text>
        <Text style={styles.buttonText}>Add Glass</Text>
        <Text style={styles.buttonSubtext}>(250ml)</Text>
      </TouchableOpacity>

      <View style={styles.glassesContainer}>
        <Text style={styles.glassesText}>
          🥛 {glassesCount} {glassesCount === 1 ? 'glass' : 'glasses'} today
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  intake: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#1565C0',
  },
  goal: {
    fontSize: 24,
    color: '#64B5F6',
    marginLeft: 8,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 40,
  },
  progressBar: {
    width: '100%',
    height: 30,
    backgroundColor: '#BBDEFB',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 15,
  },
  percentage: {
    fontSize: 18,
    color: '#1976D2',
    textAlign: 'center',
  },
  congratulations: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 30,
    paddingHorizontal: 60,
    borderRadius: 100,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonIcon: {
    fontSize: 64,
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  buttonSubtext: {
    fontSize: 16,
    color: '#E3F2FD',
    marginTop: 4,
  },
  glassesContainer: {
    marginTop: 30,
  },
  glassesText: {
    fontSize: 18,
    color: '#1976D2',
  },
});
