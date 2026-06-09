import { notFound } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { WikiRepository } from "@/lib/repositories/wiki"
import { WikiGeneratorRepository } from "@/lib/repositories/wiki-generator"
import ArticleView from "./article-view"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
)

interface ArticlePageProps {
  params: Promise<{
    username: string
    wiki_slug: string
    page_slug: string
  }>
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { username, wiki_slug, page_slug } = await params

  // 1. Resolve owner user ID
  let ownerUser: { id: string; email: string; username: string } | null = null
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, username")
      .eq("username", username.toLowerCase())
      .maybeSingle()

    if (!error && data) {
      ownerUser = data
    }
  } catch (err) {
    console.error("Error fetching owner:", err)
  }

  // 2. Fetch Wiki
  let wiki: any = null
  let isMocked = false

  if (ownerUser) {
    try {
      wiki = await WikiRepository.fetchWikiBySlug(ownerUser.id, wiki_slug)
    } catch (dbErr: any) {
      if (dbErr?.code === "42P01") isMocked = true
    }
  }

  if (!wiki) {
    wiki = {
      id: "mock-wiki-id",
      title: "Machine Learning Atlas",
      slug: wiki_slug,
    }
    isMocked = true
  }

  // 3. Fetch Page by Slug
  let page: any = null
  if (wiki?.id) {
    try {
      page = await WikiGeneratorRepository.fetchPageBySlug(wiki.id, page_slug)
    } catch (err) {
      console.error("Error fetching page:", err)
    }
  }

  // Fallback mock pages if not found/mocked
  if (!page && isMocked) {
    const mockDetails: Record<string, any> = {
      "foundations-of-data-operations": {
        id: "mock-page-1",
        wiki_id: wiki.id,
        parent_page_id: null,
        slug: "foundations-of-data-operations",
        title: "Foundations of Data Operations",
        summary: "Introductory framework, cleaning methods, and data ingestion architectures.",
        body: `
### Overview of Data Preprocessing

Before any machine learning model can be trained, raw data must be collected, parsed, and cleaned. In practice, real-world data is notoriously noisy, incomplete, and inconsistent.

### Ingestion Pipelines

Data operations (DataOps) focuses on building reproducible, version-controlled pipelines.

### Data Cleaning Methodologies

A core component is cleaning dataset coordinates [1] to ensure accuracy.
`,
        page_type: "ROOT",
        generation_status: "GENERATED",
        confidence_score: 0.98
      },
      "core-algorithmic-frameworks": {
        id: "mock-page-2",
        wiki_id: wiki.id,
        parent_page_id: "mock-page-1",
        slug: "core-algorithmic-frameworks",
        title: "Core Algorithmic Frameworks",
        summary: "Analyzing optimization gradients, neural layer dimensions, and validation splits.",
        body: `
### Mathematical Optimization

Modern neural networks learn by adjusting weights to minimize cost functions.

### Gradient Descent Optimization

Gradient descent optimization is the primary training engine [2] for modern architectures.
`,
        page_type: "TOPIC",
        generation_status: "GENERATED",
        confidence_score: 0.94
      },
      "deployment-vector-indexing": {
        id: "mock-page-3",
        wiki_id: wiki.id,
        parent_page_id: "mock-page-1",
        slug: "deployment-vector-indexing",
        title: "Deployment & Vector Indexing",
        summary: "Scaling vector databases, configuring cosine indices, and microservice APIs.",
        body: `
### Scaling ML Workloads

Once models are trained, they must be deployed as scalable services.

### Vector Databases and Embedding Search

Vector databases represent a class of storage engines specifically tuned for high-dimensional cosine similarity operations [3].
`,
        page_type: "TOPIC",
        generation_status: "GENERATED",
        confidence_score: 0.89
      }
    }
    page = mockDetails[page_slug]
  }

  if (!page) {
    return notFound()
  }

  // 4. Fetch all wiki pages (needed for rendering internal links/subtopics tree)
  let allPages: any[] = []
  if (wiki?.id) {
    try {
      allPages = await WikiGeneratorRepository.fetchWikiPages(wiki.id)
    } catch (err) {
      console.error("Error fetching all pages:", err)
    }
  }

  return (
    <ArticleView
      username={username}
      wikiSlug={wiki_slug}
      wikiId={wiki.id}
      initialPage={page}
      allPages={allPages}
    />
  )
}
