// services/firebase.ts - Mock Firebase implementation
export const auth = {
  currentUser: null,
  onAuthStateChanged: (callback: any) => {
    // Mock implementation
    return () => {};
  },
  signInWithEmailAndPassword: async (email: string, password: string) => {
    // Mock implementation
    return { user: { email, uid: 'mock-user-id' } };
  },
  signOut: async () => {
    // Mock implementation
  }
};

export const db = {
  collection: (name: string) => ({
    doc: (id: string) => ({
      get: async () => ({ data: () => ({}) }),
      set: async (data: any) => {},
      update: async (data: any) => {}
    }),
    add: async (data: any) => ({ id: 'mock-id' })
  })
};