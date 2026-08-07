import 'server-only'

import type { BlogCategory, BlogPost } from '@/lib/data/blog'
import { blogCategories } from '@/lib/data/blog'
import { stripHtml } from '@/lib/i18n/machine-translations'
import { CATALOG_REVALIDATE, isWpConfigured } from './config'
import { wpFetch } from './client'

/**
 * Live blog posts from WordPress native post type.
 *
 * Multilingual titles, excerpts and the reading time come from the
 * `blogPostFields` ACF group (see `wordpress/acf/alifleet-acf-schema.json`).
 * The post body (content) is read from the standard `content` field.
 *
 * ACF is optional here: if `blogPostFields` is missing from the schema the
 * query falls back gracefully — posts still render with the WordPress title
 * and excerpt rather than returning an error page.
 */

const PAGE_SIZE = 50
const MAX_PAGES = 10

/* ----------------------------------------------------------------- queries */

const POSTS_QUERY = /* GraphQL */ `
  query AliFleetPosts($first: Int!, $after: String) {
    posts(first: $first, after: $after, where: { status: PUBLISH }) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        databaseId
        slug
        title
        excerpt
        date
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        categories {
          nodes {
            slug
          }
        }
        blogPostFields {
          postTitleAr
          postTitleEn
          postTitleHe
          postExcerptAr
          postExcerptEn
          postExcerptHe
          readingMinutes
          authorName
          authorAvatar {
            node {
              sourceUrl
            }
          }
          featuredPost
          blogCategory
        }
      }
    }
  }
`

const SINGLE_POST_QUERY = /* GraphQL */ `
  query AliFleetPost($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      databaseId
      slug
      title
      excerpt
      content
      date
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
      categories {
        nodes {
          slug
        }
      }
      blogPostFields {
        postTitleAr
        postTitleEn
        postTitleHe
        postExcerptAr
        postExcerptEn
        postExcerptHe
        readingMinutes
        authorName
        authorAvatar {
          node {
            sourceUrl
          }
        }
        featuredPost
        blogCategory
      }
    }
  }
`

/* -------------------------------------------------------------- wire types */

type WireBlogFields = {
  postTitleAr?: string | null
  postTitleEn?: string | null
  postTitleHe?: string | null
  postExcerptAr?: string | null
  postExcerptEn?: string | null
  postExcerptHe?: string | null
  readingMinutes?: number | string | null
  authorName?: string | null
  authorAvatar?: { node: { sourceUrl: string | null } | null } | null
  featuredPost?: boolean | null
  blogCategory?: string | string[] | null
} | null

type WirePost = {
  databaseId: number
  slug: string | null
  title: string | null
  excerpt: string | null
  content?: string | null
  date: string | null
  featuredImage?: {
    node: { sourceUrl: string | null; altText: string | null } | null
  } | null
  categories?: {
    nodes: { slug: string }[]
  } | null
  blogPostFields: WireBlogFields
}

type PagedPosts = {
  posts: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null }
    nodes: WirePost[]
  } | null
}

type SinglePost = {
  post: WirePost | null
}

export type PostsStatus = 'ok' | 'not_configured' | 'unreachable' | 'empty'

export type PostList = {
  posts: BlogPost[]
  featured: BlogPost | null
  status: PostsStatus
}

/* --------------------------------------------------------------- constants */

const PLACEHOLDER_COVER = '/images/fleet-truck.png'
const PLACEHOLDER_AVATAR = '/images/hero-avatars.png'

/* ---------------------------------------------------------------- fetching */

export async function getPosts(): Promise<PostList> {
  if (!isWpConfigured()) {
    return { posts: [], featured: null, status: 'not_configured' }
  }

  const collected: WirePost[] = []
  let after: string | null = null

  try {
    for (let page = 0; page < MAX_PAGES; page++) {
      const data: PagedPosts = await wpFetch<PagedPosts>(
        POSTS_QUERY,
        { first: PAGE_SIZE, after },
        { revalidate: CATALOG_REVALIDATE }
      )
      const connection: PagedPosts['posts'] = data.posts
      if (!connection) break

      collected.push(...connection.nodes)
      if (!connection.pageInfo.hasNextPage || !connection.pageInfo.endCursor) break
      after = connection.pageInfo.endCursor
    }
  } catch (error) {
    console.log('[v0] Blog posts fetch failed:', error instanceof Error ? error.message : error)
    return { posts: [], featured: null, status: 'unreachable' }
  }

  if (collected.length === 0) {
    return { posts: [], featured: null, status: 'empty' }
  }

  const mapped = collected
    .map((node) => mapPost(node))
    .filter((p): p is BlogPost & { content?: string } => p !== null)

  const featured = mapped.find((p) => p.featured) ?? null

  return { posts: mapped, featured, status: 'ok' }
}

export async function getPost(slug: string): Promise<(BlogPost & { content: string }) | null> {
  if (!isWpConfigured()) return null

  try {
    const data = await wpFetch<SinglePost>(
      SINGLE_POST_QUERY,
      { slug },
      { revalidate: CATALOG_REVALIDATE }
    )
    const node = data.post
    if (!node) return null
    return mapPost(node, true) as (BlogPost & { content: string }) | null
  } catch (error) {
    console.log('[v0] Blog post fetch failed:', error instanceof Error ? error.message : error)
    return null
  }
}

export async function getRelatedPosts(post: BlogPost, limit = 3): Promise<BlogPost[]> {
  const { posts } = await getPosts()
  const others = posts.filter((p) => p.slug !== post.slug)
  return [
    ...others.filter((p) => p.category === post.category),
    ...others.filter((p) => p.category !== post.category),
  ].slice(0, limit)
}

/* ----------------------------------------------------------------- mapping */

function mapPost(node: WirePost, includeContent = false): (BlogPost & { content?: string }) | null {
  const slug = node.slug?.trim()
  if (!slug) return null

  const fields = node.blogPostFields
  const wpTitle = stripHtml(node.title ?? '')

  // Titles: ACF multilingual fields win, WordPress title is the safety net.
  const titleEn = text(fields?.postTitleEn) || text(fields?.postTitleAr) || text(fields?.postTitleHe) || wpTitle
  const titleAr = text(fields?.postTitleAr) || titleEn
  const titleHe = text(fields?.postTitleHe) || titleEn

  if (!titleEn) return null

  const wpExcerpt = stripHtml(node.excerpt ?? '')
  const excerptEn = text(fields?.postExcerptEn) || text(fields?.postExcerptAr) || wpExcerpt
  const excerptAr = text(fields?.postExcerptAr) || excerptEn
  const excerptHe = text(fields?.postExcerptHe) || excerptEn

  const category = resolveCategory(fields?.blogCategory, node.categories?.nodes)
  const coverImage = node.featuredImage?.node?.sourceUrl || PLACEHOLDER_COVER
  const authorName = text(fields?.authorName) || 'ALI FLEET Team'
  const authorAvatar = fields?.authorAvatar?.node?.sourceUrl || PLACEHOLDER_AVATAR
  const readingMinutes = int(fields?.readingMinutes, 3)
  const featured = fields?.featuredPost ?? false
  const publishedAt = node.date?.split('T')[0] ?? new Date().toISOString().split('T')[0]

  const post: BlogPost & { content?: string } = {
    slug,
    titleEn,
    titleAr,
    titleHe,
    excerptEn,
    excerptAr,
    excerptHe,
    category,
    coverImage,
    authorName,
    authorAvatar,
    publishedAt,
    readingMinutes,
    featured,
  }

  if (includeContent) {
    post.content = node.content ?? ''
  }

  return post
}

/* ----------------------------------------------------------------- helpers */

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function int(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number.parseInt(text(value), 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

function first(value: string | string[] | null | undefined): string {
  if (Array.isArray(value)) return text(value[0])
  return text(value)
}

/**
 * Resolves a blog category from the ACF select or WordPress categories.
 * Falls back to 'news' rather than breaking the type.
 */
function resolveCategory(
  acfValue: string | string[] | null | undefined,
  wpCategories: { slug: string }[] | undefined
): BlogCategory {
  const acf = first(acfValue).toLowerCase()
  if ((blogCategories as readonly string[]).includes(acf)) return acf as BlogCategory

  // Try matching a WordPress category slug to our taxonomy
  for (const cat of wpCategories ?? []) {
    const slug = cat.slug.toLowerCase()
    if ((blogCategories as readonly string[]).includes(slug)) return slug as BlogCategory
  }

  return 'news'
}
