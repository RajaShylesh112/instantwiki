import GraphView from "./graph-view"

interface GraphPageProps {
  params: Promise<{
    username: string
    wiki_slug: string
  }>
}

export default async function GraphPage({ params }: GraphPageProps) {
  const { username, wiki_slug } = await params
  return <GraphView username={username} wikiSlug={wiki_slug} />
}
