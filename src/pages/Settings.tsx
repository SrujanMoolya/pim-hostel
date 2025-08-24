import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Bell, Shield, Database, Settings as SettingsIcon } from "lucide-react"
import { Label } from "@/components/ui/label"

import { User } from "lucide-react"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import AccountsManager from "@/components/AccountsManager"
import CollegeDepartmentManager from "@/components/CollegeDepartmentManager"
import DataManager from "@/components/DataManager"

const Settings = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Configure your hostel management system preferences and settings
        </p>
      </div>

      


      {/* College & Department Management */}
      <Card className="lg:col-span-2">
        <CardContent className="pt-6">
          <div className="mb-8">
            <CollegeDepartmentManager />
          </div>
        </CardContent>
      </Card>
      
      {/* Accounts Management Section */}
      <Card className="lg:col-span-2">
        <CardContent className="pt-6">
          <div className="mb-8">
            <AccountsManager />
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Data Management - Now Functional */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <DataManager />
          </CardContent>
        </Card>
      </div>
    </div >
  )
}

export default Settings