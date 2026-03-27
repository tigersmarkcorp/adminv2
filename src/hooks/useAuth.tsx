import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isEmployee: boolean;
  isOjt: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);
  const [isOjt, setIsOjt] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkRoles = useCallback(async (userId: string) => {
    try {
      const [adminRes, empRes, ojtRes] = await Promise.all([
        supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
        supabase.rpc("has_role", { _user_id: userId, _role: "employee" as any }),
        supabase.rpc("has_role", { _user_id: userId, _role: "ojt" as any }),
      ]);
      setIsAdmin(!!adminRes.data);
      setIsEmployee(!!empRes.data);
      setIsOjt(!!ojtRes.data);
    } catch {
      setIsAdmin(false);
      setIsEmployee(false);
      setIsOjt(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(async () => {
            if (!mounted) return;
            await checkRoles(session.user.id);
            if (mounted) setLoading(false);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsEmployee(false);
          setIsOjt(false);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await checkRoles(session.user.id);
      }
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkRoles]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setIsEmployee(false);
    setIsOjt(false);
  };

  return (
    <AuthContext.Provider value={{ session, user, isAdmin, isEmployee, isOjt, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
