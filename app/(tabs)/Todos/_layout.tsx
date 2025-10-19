// import { Entypo, FontAwesome5 } from "@expo/vector-icons";
// import { Tabs } from "expo-router";

import { Stack } from "expo-router";

// export default function RootLayout() {
//   return (
//     <Tabs screenOptions={{ tabBarActiveTintColor: "red", headerShown: false }}>
//       <Tabs.Screen
//         name="[todo]"
//         options={{
//           title: "Todos",
//           href: null,
//           tabBarIcon: ({ color, size, focused }) => (
//             <FontAwesome5 name="list" size={size} color={color} />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="addTodo"
//         options={{
//           title: "add Todo",
//           href: null,
//           tabBarIcon: ({ color, size, focused }) => (
//             <Entypo name="add-to-list" size={size} color={color} />
//           ),
//         }}
//       />
//     </Tabs>
//   );
// }
export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="[todo]"
        options={{
          title: "Todos",
        }}
      />
      <Stack.Screen
        name="addTodo"
        options={{
          title: "add Todo",
        }}
      />
    </Stack>
  );
}
