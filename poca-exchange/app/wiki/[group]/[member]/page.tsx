import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { Breadcrumb } from '@/components/breadcrumb';
import { getMemberBreadcrumbs } from '@/lib/breadcrumb-utils';
import { createBreadcrumbSchema, createOrganizationSchema } from '@/lib/json-ld-utils';

interface MemberWikiPageProps {
  params: Promise<{
    group: string;
    member: string;
  }>;
}

export async function generateMetadata(
  { params }: MemberWikiPageProps
): Promise<Metadata> {
  const { group, member } = await params;
  return {
    title: `${member} - ${group}`,
    description: `${member}의 포토카드 도감`,
  };
}

export default async function MemberWikiPage({ params }: MemberWikiPageProps) {
  const { group, member } = await params;

  // Generate breadcrumb items for JSON-LD and UI
  // Note: Using slug as name since dynamic data is not fetched on this page yet
  const breadcrumbs = getMemberBreadcrumbs(group, group, member, member);

  // Generate JSON-LD structured data
  const jsonLdScripts = [
    createBreadcrumbSchema(
      breadcrumbs.map((item, idx) => ({
        name: item.name,
        url: item.url ? `https://www.stanpc.com${item.url}` : `https://www.stanpc.com/wiki/${group}/${member}`,
        position: idx + 1,
      }))
    ),
    createOrganizationSchema(),
  ];

  return (
    <>
      {/* JSON-LD Structured Data */}
      {jsonLdScripts.map((jsonLd, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ))}

      <div className="min-h-screen bg-white dark:bg-neutral-950">
        <div className="mx-auto max-w-6xl px-4 py-8">
          {/* Breadcrumb Navigation */}
          <Breadcrumb items={breadcrumbs} className="mb-4" />

          <Link href="/wiki" className="text-blue-600 hover:underline mb-4 block">
            ← 돌아가기
          </Link>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
          {member}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">{group}</p>

        <div className="mt-12">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center dark:border-neutral-700 dark:bg-neutral-800">
            <p className="text-neutral-600 dark:text-neutral-400">
              이 멤버의 포토카드 도감 준비 중입니다
            </p>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
