import { useAuth } from "@/lib/auth-context";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { Tabs, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";

export default function RootLayout() {
  const route = useRouter();
  const { signOut } = useAuth();

  const goToTodo = (date: string) => {
    route.push({
      pathname: "/Todos/addTodo",
      params: { date: date },
    });
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "red",
        // headerShown: false,
        headerRight: () => (
          <TouchableOpacity
            style={{
              backgroundColor: "#f0f8ff",
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 8,
              borderWidth: 1.5,
              borderColor: "#3b82f6",
              marginRight: 20,
            }}
            onPress={signOut}
          >
            <Feather name="log-out" size={24} color="3b82f6" />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="Dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => {
            return (
              <MaterialIcons name="space-dashboard" size={size} color={color} />
            );
          },
          // headerRight: () => (
          //   <TouchableOpacity
          //     style={{
          //       backgroundColor: "#f0f8ff",
          //       paddingHorizontal: 16,
          //       paddingVertical: 10,
          //       borderRadius: 20,
          //       borderWidth: 1.5,
          //       borderColor: "#3b82f6",
          //       marginRight: 20,
          //     }}
          //     onPress={() => console.log("Location pressed")}
          //   >
          //     <Text
          //       style={{ fontSize: 15, color: "#3b82f6", fontWeight: "600" }}
          //     >
          //       📍 Dhaka
          //     </Text>
          //   </TouchableOpacity>
          // ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color, size, focused }) => {
            return focused ? (
              <FontAwesome5 name="calendar-alt" size={size} color={color} />
            ) : (
              <FontAwesome5 name="calendar-check" size={size} color={color} />
            );
          },
          // headerRight: () => (
          //   <TouchableOpacity
          //     style={{
          //       backgroundColor: "#f0f8ff",
          //       paddingHorizontal: 16,
          //       paddingVertical: 10,
          //       borderRadius: 20,
          //       borderWidth: 1.5,
          //       borderColor: "#3b82f6",
          //       marginRight: 20,
          //     }}
          //     onPress={() => console.log("Location pressed")}
          //   >
          //     <Text
          //       style={{ fontSize: 15, color: "#3b82f6", fontWeight: "600" }}
          //     >
          //       📍 Dhaka
          //     </Text>
          //   </TouchableOpacity>
          // ),
        }}
      />
      <Tabs.Screen
        name="Todos"
        options={{
          title: "Todos",
          href: null,
          // headerRight: () => (
          //   <TouchableOpacity
          //     style={{
          //       backgroundColor: "#f0f8ff",
          //       paddingHorizontal: 16,
          //       paddingVertical: 10,
          //       borderRadius: 20,
          //       borderWidth: 1.5,
          //       borderColor: "#3b82f6",
          //       marginRight: 20,
          //     }}
          //     onPress={goToTodo}
          //   >
          //     <Entypo name="add-to-list" size={24} color={"3b82f6"} />
          //   </TouchableOpacity>
          // ),
          // tabBarIcon: ({ color, size, focused }) => (
          //   <FontAwesome5 name="tasks" size={size} color={color} />
          // ),
        }}
      />
      {/* <Tabs.Screen
        name="addTodo"
        options={{
          title: "Todos",
          tabBarIcon: ({ color, size, focused }) => (
            <FontAwesome5 name="tasks" size={size} color={color} />
          ),
        }}
      /> */}
    </Tabs>
  );
}
