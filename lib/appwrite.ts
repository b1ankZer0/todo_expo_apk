import { Account, Client, Databases } from "react-native-appwrite";

const serverData = {
  APPWRITE_PROJECT_ID: "68e7e7070001b93d3566",
  APPWRITE_PROJECT_NAME: "todo 2",
  APPWRITE_ENDPOINT: "https://fra.cloud.appwrite.io/v1",
  APPWRITE_DEV_KEY:
    "a3d20eb506fa1941a81d2b0ac81f38cd85a0076a03bc4111cd617f32d62156276ea9ead4bc174b2d499b652d8d913808a9c39ee022f23c90f09c2bb348b17d1e75bc184db67da9240b9c064c4775a5d86bc6bff57ee50f450da0b23c0fddaa9e7d65dbd26687a04e749f2c549171e5db97b9461191e20e7ca1594d4f8244ca3c",
  DB_ID: "68ecaa8d002c230b9323",
  DB_TODOS: "todos",
};

export const client = new Client()
  .setEndpoint(serverData.APPWRITE_ENDPOINT!)
  .setProject(serverData.APPWRITE_PROJECT_ID!);
// .setDevKey(serverData.APPWRITE_DEV_KEY!);

export const account = new Account(client);
export const DB = new Databases(client);

export const Db_Id = serverData.DB_ID!;
