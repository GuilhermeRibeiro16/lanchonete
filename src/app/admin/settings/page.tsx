import { getSettings } from '@/lib/actions/settings'
import SettingsClient from '@/components/admin//SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const settings = await getSettings()
  return <SettingsClient initialSettings={settings} />
}