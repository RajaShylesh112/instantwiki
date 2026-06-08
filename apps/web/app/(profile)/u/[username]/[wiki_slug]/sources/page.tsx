import SourcesView from "./sources-view"

interface SourcesPageProps {
  params: Promise<{
    username: string
    wiki_slug: string
  }>
}

export default async function SourcesPage({ params }: SourcesPageProps) {
  const { username, wiki_slug } = await params
  return <SourcesView username={username} wikiSlug={wiki_slug} />
}
