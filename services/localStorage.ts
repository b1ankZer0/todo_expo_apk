import AsyncStorage from "@react-native-async-storage/async-storage";

export const localStorages = {
  saveData: async (key: string, value: any) => {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      console.log(`✅ Saved data for key: ${key}`);
    } catch (e) {
      console.error("Error saving data:", e);
    }
  },
  getData: async (key: string) => {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      console.log(
        `📖 Reading data for key: ${key}`,
        jsonValue ? "Found" : "Not found"
      );
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error("Error reading data:", e);
      return null;
    }
  },
  removeData: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error("Error removing data:", e);
    }
  },
  clearAll: async () => {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.error("Error clearing data:", e);
    }
  },
};
