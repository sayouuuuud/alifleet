import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BlogArticle } from '@/components/blog-article'
import { blogPosts, getBlogPost } from '@/lib/data/blog'

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPost(slug)

  if (!post) return { title: 'Article not found | ALI FLEET' }

  return {
    title: `${post.titleEn} | ALI FLEET`,
    description: post.excerptEn,
    openGraph: {
      title: post.titleEn,
      description: post.excerptEn,
      type: 'article',
      publishedTime: post.publishedAt,
      images: [{ url: post.coverImage }],
    },
  }
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getBlogPost(slug)

  if (!post) notFound()

  const related = blogPosts
    .filter((item) => item.slug !== post.slug)
    .sort((a, b) => Number(b.category === post.category) - Number(a.category === post.category))
    .slice(0, 3)

  return <BlogArticle post={post} related={related} />
}
