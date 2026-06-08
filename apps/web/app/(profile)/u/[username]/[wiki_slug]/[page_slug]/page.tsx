import { notFound } from "next/navigation"
import ArticleView from "./article-view"
import { mockArticles } from "../mock-data"

interface ArticlePageProps {
  params: Promise<{
    username: string
    wiki_slug: string
    page_slug: string
  }>
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { username, wiki_slug, page_slug } = await params

  // Retrieve matching article from mock database
  const article = mockArticles[page_slug]

  if (!article) {
    return notFound()
  }

  return (
    <ArticleView
      username={username}
      wikiSlug={wiki_slug}
      article={article}
    />
  )
}
