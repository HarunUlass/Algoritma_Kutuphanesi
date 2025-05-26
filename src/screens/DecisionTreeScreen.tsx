import React, { useContext, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { DecisionTreeVisualization } from '../components';
import { AuthContext } from '../../App';

const DecisionTreeScreen = ({ route, navigation }: any) => {
  const { isLoggedIn, addViewedAlgorithm } = useContext(AuthContext);
  const algorithmId = "decision-tree"; // Unique identifier for this algorithm

  useEffect(() => {
    // Record this algorithm view in user history if logged in
    if (isLoggedIn) {
      addViewedAlgorithm({
        id: algorithmId,
        title: "Karar Ağacı Algoritması",
        description: "Sınıflandırma ve regresyon için kullanılan bir denetimli öğrenme algoritması",
        complexity: "O(n*log(n))",
        difficulty: "Orta",
        category: "Makine Öğrenmesi"
      });
    }
  }, [isLoggedIn]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.content}>
          <DecisionTreeVisualization 
            title="Karar Ağacı Algoritması Görselleştirmesi" 
            animationSpeed={1000}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  }
});

export default DecisionTreeScreen; 