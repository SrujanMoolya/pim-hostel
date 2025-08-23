import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserAccount {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  created_at: string;
}

export default function AccountsManager() {
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
    else setAccounts(data.users.map((u: any) => ({ 
      id: u.id, 
      email: u.email,
      email_confirmed_at: u.email_confirmed_at,
      last_sign_in_at: u.last_sign_in_at,
      created_at: u.created_at
    })));
  }

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess("");
    const { data, error } = await supabase.auth.admin.createUser({ 
      email, 
      password,
      email_confirm: true
    });
    setLoading(false);
    if (error) setError(error.message);
    else {
      setSuccess("Account created successfully");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      fetchAccounts();
    }
  }

  async function handleApproveAccount(id: string) {
    setLoading(true);
    setError("");
    setSuccess("");
    const { error } = await supabase.auth.admin.updateUserById(id, { 
      email_confirm: true 
    });
    setLoading(false);
    if (error) setError(error.message);
    else {
      setSuccess("Account approved");
      fetchAccounts();
    }
  }

  async function handleDisapproveAccount(id: string) {
    setLoading(true);
    setError("");  
    setSuccess("");
    const { error } = await supabase.auth.admin.updateUserById(id, { 
      email_confirm: false 
    });
    setLoading(false);
    if (error) setError(error.message);
    else {
      setSuccess("Account access revoked");
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
    // Generate a new password for the user
    const newPassword = Math.random().toString(36).slice(-10);
    const { error } = await supabase.auth.admin.updateUserById(id, { password: newPassword });
    setLoading(false);
    if (error) setError(error.message);
    else setSuccess(`Password reset to: ${newPassword}`);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Accounts Management</h2>
      
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="font-semibold">Create New Account</h3>
        <form onSubmit={handleAddAccount} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div>
            <Label>Confirm Password</Label>
            <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          </div>
          <Button type="submit" disabled={loading}>Create Account</Button>
        </form>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {success && <div className="text-green-600 text-sm">{success}</div>}
      <div>
        <h3 className="font-semibold mb-2">All Accounts</h3>
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted p-3 grid grid-cols-6 gap-4 font-medium text-sm">
            <div>Email</div>
            <div>Status</div>
            <div>Created</div>
            <div>Last Login</div>
            <div>Access Control</div>
            <div>Actions</div>
          </div>
          {accounts.map(acc => (
            <div key={acc.id} className="p-3 border-t grid grid-cols-6 gap-4 items-center text-sm">
              <div className="font-medium">{acc.email}</div>
              <div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  acc.email_confirmed_at 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                }`}>
                  {acc.email_confirmed_at ? 'Active' : 'Pending'}
                </span>
              </div>
              <div>{new Date(acc.created_at).toLocaleDateString()}</div>
              <div>{acc.last_sign_in_at ? new Date(acc.last_sign_in_at).toLocaleDateString() : 'Never'}</div>
              <div className="flex gap-1">
                {acc.email_confirmed_at ? (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs"
                    onClick={() => handleDisapproveAccount(acc.id)}
                  >
                    Revoke Access
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="default" 
                    className="text-xs"
                    onClick={() => handleApproveAccount(acc.id)}
                  >
                    Approve
                  </Button>
                )}
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="text-xs" onClick={() => handleResetPassword(acc.id)}>
                  Reset Password
                </Button>
                <Button size="sm" variant="destructive" className="text-xs" onClick={() => handleDelete(acc.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
