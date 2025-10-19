import { Account, Client, Databases, ID } from "appwrite";
import { useRouter } from "expo-router";
import { useAuth } from "./auth-context";

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
const DB = new Databases(client);

export const Db_Id = serverData.DB_ID!;

interface SubscribePayload {
  created: boolean;
  updated: boolean;
  deleted: boolean;
  payload: any;
}

interface DbActions {
  create: (data: any) => Promise<any>;
  update: (documentId: string, data: any) => Promise<any>;
  get: (documentId: string) => Promise<any>;
  delete: (documentId: string) => Promise<any>;
  getAll: (queries?: string[]) => Promise<any>;
  subscribe: (callback: (payload: SubscribePayload) => void) => () => void;
}

const dbActions = (Table: string): DbActions => {
  return {
    create: async (data: any) => {
      return await DB.createDocument(Db_Id, Table, ID.unique(), data);
    },
    update: async (documentId: string, data: any) => {
      return await DB.updateDocument(Db_Id, Table, documentId, data);
    },
    get: async (documentId: string) => {
      return await DB.getDocument(Db_Id, Table, documentId);
    },
    delete: async (documentId: string) => {
      return await DB.deleteDocument(Db_Id, Table, documentId);
    },
    getAll: async (queries?: string[]) => {
      return await DB.listDocuments(Db_Id, Table, queries);
    },
    subscribe: (callback: (payload: SubscribePayload) => void) => {
      const unsubscribe = client.subscribe(
        [`databases.${Db_Id}.collections.${Table}.documents`],
        (response) => {
          const payload: SubscribePayload = {
            created: response.events.includes(
              `databases.*.collections.*.documents.*.create`
            ),
            updated: response.events.includes(
              `databases.*.collections.*.documents.*.update`
            ),
            deleted: response.events.includes(
              `databases.*.collections.*.documents.*.delete`
            ),
            payload: response.payload,
          };
          callback(payload);
        }
      );

      // Return unsubscribe function
      return unsubscribe;
    },
  };
};

interface DbReturnType {
  [key: string]: DbActions;
}

interface Tables {
  [key: string]: string;
}

// Export as a regular object instead of a function
export const createDb = (userId?: string): DbReturnType => {
  const router = useRouter();

  if (!userId) {
    router.replace("/auth");
  }

  const tables: Tables = {
    todo: serverData.DB_TODOS!,
  };

  const db: DbReturnType = {};

  Object.keys(tables).forEach((table) => {
    db[table] = dbActions(tables[table]);
  });

  return db;
};

// Alternative: Export individual table actions directly
export const TodoDb = dbActions(serverData.DB_TODOS!);

export const useDb = (): DbReturnType => {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    router.replace("/auth");
  }

  const tables: Tables = {
    todo: serverData.DB_TODOS!,
  };

  const db: DbReturnType = {};

  Object.keys(tables).forEach((table) => {
    db[table] = dbActions(tables[table]);
  });

  return db;
};
