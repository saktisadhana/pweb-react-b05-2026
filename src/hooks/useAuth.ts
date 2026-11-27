import { useState } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { createAccount, GUEST, toUser, verifyLogin, type Account, type RegisterInput, type User } from '../utils/auth';

const SESSION_KEY = 'sesi';

// "Ingat saya" -> sesi di localStorage (tetap login setelah browser ditutup).
// Tanpa "Ingat saya" -> sessionStorage (hilang saat tab ditutup).
function readSession(accounts: Account[]): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { username } = JSON.parse(raw) as { username?: string };
    if (username === GUEST.username) return GUEST;
    const account = accounts.find((a) => a.username === username);
    return account ? toUser(account) : null;
  } catch {
    return null;
  }
}

function writeSession(username: string | null, remember: boolean) {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    if (username) (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify({ username }));
  } catch {
    // Storage diblokir: login tetap jalan, hanya tidak diingat.
  }
}

export function useAuth() {
  const [accounts, setAccounts] = useLocalStorage<Account[]>('akun', []);
  const [user, setUser] = useState<User | null>(() => readSession(accounts));

  const login = async (username: string, password: string, remember: boolean) => {
    const account = await verifyLogin(username, password, accounts);
    writeSession(account.username, remember);
    setUser(toUser(account));
  };

  const register = async (input: RegisterInput, remember: boolean) => {
    const account = await createAccount(input, accounts);
    setAccounts((prev) => [...prev, account]);
    writeSession(account.username, remember);
    setUser(toUser(account));
  };

  const loginAsGuest = () => {
    writeSession(GUEST.username, false);
    setUser(GUEST);
  };

  const logout = () => {
    writeSession(null, false);
    setUser(null);
  };

  return { user, login, register, loginAsGuest, logout };
}
