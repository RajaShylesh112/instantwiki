import SettingsView from "./settings-view"

interface SettingsPageProps {
  params: Promise<{
    username: string
    wiki_slug: string
  }>
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { username, wiki_slug } = await params
  return <SettingsView username={username} wikiSlug={wiki_slug} />
}
