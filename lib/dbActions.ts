import { useRouter } from "expo-router";
import { ID } from "react-native-appwrite";
import { client, DB, Db_Id } from "./appwrite";
import { useAuth } from "./auth-context";

const serverData = {
  DB_ID: "68ecaa8d002c230b9323",
  DB_TODOS: "todos",
};

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
