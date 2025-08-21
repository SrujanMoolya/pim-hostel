import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserAccount {
  id: string;
  email: string;
}

export default function AccountsManager() {
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    setLoading(true);
    setError("");
    const { data, error } = await supabase.auth.admin.listUsers();
    setLoading(false);
    if (error) setError(error.message);
    else setAccounts(data.users.map((u: any) => ({ id: u.id, email: u.email })));
  }

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const { data, error } = await supabase.auth.admin.createUser({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else {
      setSuccess("Account created");
      setEmail("");
      setPassword("");
      fetchAccounts();
    }
  }

  async function handleDelete(id: string) {
    setLoading(true);
    setError("");
    setSuccess("");
    const { error } = await supabase.auth.admin.deleteUser(id);
    setLoading(false);
    if (error) setError(error.message);
    else {
      setSuccess("Account deleted");
      fetchAccounts();
    }
  }

  async function handleResetPassword(id: string) {
    setLoading(true);
    setError("");
    setSuccess("");
    // This will send a reset email to the user
    const { error } = await supabase.auth.admin.resetPasswordForEmail(accounts.find(a => a.id === id)?.email || "");
    setLoading(false);
    if (error) setError(error.message);
    else setSuccess("Password reset email sent");
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Accounts Management</h2>
      <form onSubmit={handleAddAccount} className="flex gap-2 items-end">
        <div>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div>
          <Label>Password</Label>
          <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" disabled={loading}>Add Account</Button>
      </form>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {success && <div className="text-green-600 text-sm">{success}</div>}
      <div>
        <h3 className="font-semibold mb-2">All Accounts</h3>
        <ul className="space-y-2">
          {accounts.map(acc => (
            <li key={acc.id} className="flex items-center gap-2">
              <span className="flex-1">{acc.email}</span>
              <Button size="sm" variant="outline" onClick={() => handleResetPassword(acc.id)}>Reset Password</Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(acc.id)}>Delete</Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
