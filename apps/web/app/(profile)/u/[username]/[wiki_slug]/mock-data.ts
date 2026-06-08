export interface MockSource {
  id: string
  name: string
  uploadedAt: string
  pagesCount: number
  conceptsCount: number
}

export interface MockCitation {
  id: string
  sourceName: string
  page: number
  highlight: string
  context: string
}

export interface MockArticle {
  slug: string
  title: string
  summary: string
  body: string
  relatedSlugs: string[]
  citations: string[] // Citation IDs
}

export const mockSources: MockSource[] = [
  {
    id: "src-1",
    name: "GenomicsAnalysis.pdf",
    uploadedAt: "3 days ago",
    pagesCount: 12,
    conceptsCount: 15,
  },
  {
    id: "src-2",
    name: "VariantPathogenicityGuide.pdf",
    uploadedAt: "5 days ago",
    pagesCount: 5,
    conceptsCount: 10,
  },
  {
    id: "src-3",
    name: "ETL_Extraction_Protocol_v1.pdf",
    uploadedAt: "1 day ago",
    pagesCount: 8,
    conceptsCount: 6,
  },
]

export const mockCitations: Record<string, MockCitation> = {
  "1": {
    id: "1",
    sourceName: "GenomicsAnalysis.pdf",
    page: 12,
    highlight: "Data cleaning is the process of detecting and correcting (or removing) corrupt or inaccurate records from a record set, table, or database.",
    context: "When building machine learning models, data preprocessing is essential. Data cleaning is the process of detecting and correcting (or removing) corrupt or inaccurate records from a record set, table, or database. This step prevents garbage-in, garbage-out failures.",
  },
  "2": {
    id: "2",
    sourceName: "VariantPathogenicityGuide.pdf",
    page: 5,
    highlight: "Gradient descent optimization remains the primary training engine for modern deep neural network architectures.",
    context: "In mathematical optimization, gradient descent optimization remains the primary training engine for modern deep neural network architectures. Iterative steps are taken proportional to the negative of the gradient of the function.",
  },
  "3": {
    id: "3",
    sourceName: "ETL_Extraction_Protocol_v1.pdf",
    page: 3,
    highlight: "Vector databases represent a class of storage engines specifically tuned for high-dimensional cosine similarity operations.",
    context: "For production scaling, vector databases represent a class of storage engines specifically tuned for high-dimensional cosine similarity operations. They allow nearest-neighbor queries in sub-millisecond ranges.",
  },
}

export const mockArticles: Record<string, MockArticle> = {
  "foundations-of-data-operations": {
    slug: "foundations-of-data-operations",
    title: "Foundations of Data Operations",
    summary: "Introductory framework, cleaning methods, and data ingestion architectures.",
    body: `
### Overview of Data Preprocessing

Before any machine learning model can be trained, raw data must be collected, parsed, and cleaned. In practice, real-world data is notoriously noisy, incomplete, and inconsistent. Data preprocessing prepares this raw information by addressing missing data, handling outlier anomalies, and scaling numeric distributions.

### Ingestion Pipelines and Operations

Data operations (DataOps) focuses on building reproducible, version-controlled pipelines that automate data flows. This ensures that the training set fed into deep learning frameworks is consistently formatted.

### Data Cleaning Methodologies

A core component of DataOps is data cleaning [1]. This includes:
1. **Handling Missing Values:** Using mean/median imputation or K-nearest neighbors algorithms to fill blanks.
2. **Feature Scaling:** Normalizing input values to a [0, 1] range or standardizing to zero mean and unit variance.
3. **Outlier Filtering:** Leveraging IQR (Interquartile Range) or Isolation Forests to identify and isolate anomalies.
    `,
    relatedSlugs: ["core-algorithmic-frameworks", "deployment-vector-indexing"],
    citations: ["1"],
  },
  "core-algorithmic-frameworks": {
    slug: "core-algorithmic-frameworks",
    title: "Core Algorithmic Frameworks",
    summary: "Analyzing optimization gradients, neural layer dimensions, and validation splits.",
    body: `
### Mathematical Optimization

Modern neural networks learn by adjusting internal weights and biases to minimize a cost function. This cost function represents the discrepancy between the network's prediction and the actual ground truth.

### Gradient Descent Optimization

Gradient descent optimization remains the primary training engine for modern deep neural network architectures [2]. The learning rate parameter $\\eta$ controls the step size taken in the direction of steepest descent. If the learning rate is too large, the training process can overshoot and diverge; if it is too small, convergence becomes excessively slow.

### Neural Architectures & Layers

Common layers in standard architectures include:
- **Dense Layers:** Fully connected layers that multiply inputs by a weight matrix and add a bias vector.
- **Activation Functions:** Introducing non-linear operations (such as ReLU, GELU, or Sigmoid) so that the network can model non-linear boundaries.
- **Normalizing Layers:** Batch Normalization or Layer Normalization that smooths gradients and speeds up training.
    `,
    relatedSlugs: ["foundations-of-data-operations", "deployment-vector-indexing"],
    citations: ["2"],
  },
  "deployment-vector-indexing": {
    slug: "deployment-vector-indexing",
    title: "Deployment & Vector Indexing",
    summary: "Scaling vector databases, configuring cosine indices, and microservice APIs.",
    body: `
### Scaling ML Workloads

Once models are trained and validated, they must be deployed as scalable services to serve real-time predictions. This requires wrapping the model in a lightweight API framework (such as FastAPI) and containerizing it using Docker.

### Vector Databases and Embedding Search

In retrieval-augmented generation (RAG) and semantic search architectures, text documents are represented as high-dimensional vector embeddings. Vector databases represent a class of storage engines specifically tuned for high-dimensional cosine similarity operations [3]. 

### Cosine Similarity Search

To search for relevant context:
1. The incoming query is converted into an embedding using the same encoder model.
2. A cosine similarity query is run against the database to fetch the top-k nearest neighbors.
3. The returned contexts are passed into the LLM prompt to generate an accurate, facts-grounded answer.
    `,
    relatedSlugs: ["foundations-of-data-operations", "core-algorithmic-frameworks"],
    citations: ["3"],
  },
}

export const mockNodes = [
  { id: "foundations-of-data-operations", name: "Foundations of Data Operations", slug: "foundations-of-data-operations", group: 1, val: 25 },
  { id: "core-algorithmic-frameworks", name: "Core Algorithmic Frameworks", slug: "core-algorithmic-frameworks", group: 2, val: 30 },
  { id: "deployment-vector-indexing", name: "Deployment & Vector Indexing", slug: "deployment-vector-indexing", group: 3, val: 20 },
  { id: "data-cleaning", name: "Data Cleaning", slug: "foundations-of-data-operations", group: 1, val: 12 },
  { id: "gradient-descent", name: "Gradient Descent", slug: "core-algorithmic-frameworks", group: 2, val: 15 },
  { id: "activation-functions", name: "Activation Functions", slug: "core-algorithmic-frameworks", group: 2, val: 10 },
  { id: "vector-databases", name: "Vector Databases", slug: "deployment-vector-indexing", group: 3, val: 18 },
  { id: "cosine-similarity", name: "Cosine Similarity", slug: "deployment-vector-indexing", group: 3, val: 12 },
]

export const mockLinks = [
  { source: "foundations-of-data-operations", target: "data-cleaning" },
  { source: "core-algorithmic-frameworks", target: "gradient-descent" },
  { source: "core-algorithmic-frameworks", target: "activation-functions" },
  { source: "deployment-vector-indexing", target: "vector-databases" },
  { source: "deployment-vector-indexing", target: "cosine-similarity" },
  { source: "foundations-of-data-operations", target: "core-algorithmic-frameworks" },
  { source: "core-algorithmic-frameworks", target: "deployment-vector-indexing" },
]
