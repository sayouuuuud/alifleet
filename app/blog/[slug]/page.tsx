import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPost, getRelatedPosts } from '@/lib/wp/posts'
import { BlogArticle } from '@/components/blog-article'

// Dynamic rendering — slugs come from WordPress at runtime.
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: 'Article not found | ALI FLEET' }

  return {
    title: `${post.titleEn} | ALI FLEET`,
    description: post.excerptEn,
    openGraph: {
      title: post.titleEn,
      description: post.excerptEn,
      type: 'article',
      publishedTime: post.publishedAt,
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
    },
  }
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  const related = await getRelatedPosts(post)

  return <BlogArticle post={post} related={related} />
}
