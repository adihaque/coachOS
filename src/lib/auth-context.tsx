"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "./firebase";
import type { Role } from "./types";

interface SessionUser {
  uid: string;
  email: string | null;
  name: string | null;
  role: Role | null;
  tenantId: string | null;
  tenantSlug: string | null;
  linkedStudentIds: string[];
}

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  logout: async () => {},
});

async function resolveSessionUser(firebaseUser: User): Promise<SessionUser> {
  const token = await firebaseUser.getIdTokenResult();
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    name: firebaseUser.displayName,
    role: (token.claims.role as Role) ?? null,
    tenantId: (token.claims.tenantId as string) ?? null,
    tenantSlug: (token.claims.tenantSlug as string) ?? null,
    linkedStudentIds: (token.claims.linkedStudentIds as string[]) ?? [],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const session = await resolveSessionUser(firebaseUser);
          setUser(session);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Unable to resolve the signed-in user.", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return <AuthContext.Provider value={{ user, loading, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
