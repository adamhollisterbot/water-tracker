import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const GLASS_SIZE = 250; // ml
const DAILY_GOAL = 2000; // ml
const MAX_INTAKE = DAILY_GOAL + 1000; // Cap at goal + 1L

const STORAGE_KEYS = {
  LAST_RESET: 'water_tracker_last_reset',
  INTAKE: 'water_tracker_intake',
};

export default function App() {
  const [intake, setIntake] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [goalReached, setGoalReached] = useState(false);
  
  // useRef for animation to avoid recreating on each render
  const celebrationAnim = useRef(new Animated.Value(0)).current;
  // Track if initial load is complete to prevent saving during load
  const isInitialized = useRef(false);

  const celebrate = useCallback(() => {
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
  }, [celebrationAnim]);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const today = new Date().toDateString();
        const savedDate = await AsyncStorage.getItem(STORAGE_KEYS.LAST_RESET);
        
        if (savedDate !== today) {
          // New day, reset
          await AsyncStorage.multiSet([
            [STORAGE_KEYS.LAST_RESET, today],
            [STORAGE_KEYS.INTAKE, '0'],
          ]);
          setIntake(0);
          setGoalReached(false);
        } else {
          const savedIntake = await AsyncStorage.getItem(STORAGE_KEYS.INTAKE);
          if (savedIntake !== null) {
            const intakeValue = parseInt(savedIntake, 10);
            if (!isNaN(intakeValue)) {
              setIntake(intakeValue);
              setGoalReached(intakeValue >= DAILY_GOAL);
            }
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
        isInitialized.current = true;
      }
    };

    loadData();
  }, []);

  // Save data when intake changes (only after initial load)
  useEffect(() => {
    if (!isInitialized.current) return;

    const saveData = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.INTAKE, intake.toString());
      } catch (error) {
        console.error('Error saving data:', error);
      }
    };

    saveData();
  }, [intake]);

  // Check for goal completion
  useEffect(() => {
    if (!isInitialized.current) return;
    
    if (intake >= DAILY_GOAL && !goalReached) {
      setGoalReached(true);
      celebrate();
    }
  }, [intake, goalReached, celebrate]);

  const addGlass = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIntake(prev => Math.min(prev + GLASS_SIZE, MAX_INTAKE));
  }, []);

  const removeGlass = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIntake(prev => Math.max(prev - GLASS_SIZE, 0));
  }, []);

  const progress = Math.min(intake / DAILY_GOAL, 1);
  const glassesCount = Math.floor(intake / GLASS_SIZE);

  const celebrationScale = celebrationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

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

      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.button, styles.removeButton]}
          onPress={removeGlass}
          activeOpacity={0.7}
          disabled={intake === 0}
        >
          <Text style={styles.buttonIcon}>➖</Text>
          <Text style={styles.smallButtonText}>Remove</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.addButton]}
          onPress={addGlass}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonIcon}>💧</Text>
          <Text style={styles.buttonText}>Add Glass</Text>
          <Text style={styles.buttonSubtext}>({GLASS_SIZE}ml)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.glassesContainer}>
        <Text style={styles.glassesText}>
          🥛 {glassesCount} {glassesCount === 1 ? 'glass' : 'glasses'} today
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#1976D2',
  },
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
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  button: {
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 100,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 30,
    paddingHorizontal: 40,
  },
  removeButton: {
    backgroundColor: '#78909C',
  },
  buttonIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  smallButtonText: {
    fontSize: 16,
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
