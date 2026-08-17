import { Metadata } from 'next';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import AlbumGalleryClient from '@/components/gallery/AlbumGalleryClient';

interface AlbumPageProps {
  params: Promise<{
    albumId: string;
  }>;
}

export async function generateMetadata({
  params,
}: AlbumPageProps): Promise<Metadata> {
  const { albumId } = await params;

  try {
    const album = await prisma.album.findFirst({
      where: {
        id: decodeURIComponent(albumId),
      },
      select: { title: true },
    });

    const albumTitle = album?.title || 'Album Gallery';

    return {
      title: `${albumTitle} 도감 - StanPC`,
      description: `${albumTitle} 포토카드 전체 도감`,
      openGraph: {
        title: `${albumTitle} 도감`,
        description: `${albumTitle} 포토카드를 바인더에 추가하세요`,
        type: 'website',
      },
    };
  } catch (error) {
    return {
      title: 'Album Gallery - StanPC',
    };
  }
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { albumId } = await params;
  const decodedAlbumId = decodeURIComponent(albumId);
  const session = await auth();
  const userId = session?.user?.id;

  try {
    // Fetch album to get title
    const album = await prisma.album.findFirst({
      where: {
        id: decodedAlbumId,
      },
      select: { title: true },
    });

    const albumTitle = album?.title || decodedAlbumId;

    // Fetch all cards for this album
    const cards = await prisma.photoCard.findMany({
      where: {
        albumId: decodedAlbumId,
      },
      select: {
        id: true,
        slug: true,
        imageUrl: true,
        thumbImagePath: true,
        cardName: true,
        member: {
          select: { nameKr: true, nameEn: true },
        },
        group: {
          select: { nameKr: true, nameEn: true },
        },
      },
      orderBy: [
        { group: { nameKr: 'asc' } },
        { member: { nameKr: 'asc' } },
      ],
    });

    if (!cards || cards.length === 0) {
      return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">도감을 찾을 수 없습니다</h1>
            <p className="text-neutral-400 mb-4">{albumTitle}</p>
            <a
              href="/gallery"
              className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
            >
              갤러리로 돌아가기
            </a>
          </div>
        </div>
      );
    }

    // Fetch user's owned/wished cards if logged in
    let userCardIds = new Set<string>();
    if (userId) {
      const userCards = await prisma.userBinderCard.findMany({
        where: {
          userId,
          cardId: { in: cards.map((c) => c.id) },
        },
        select: { cardId: true },
      });
      userCardIds = new Set(userCards.map((uc) => uc.cardId));
    }

    // Transform to PhotocardItem format
    const photocardItems = cards.map((card) => ({
      id: card.id,
      cardSlug: card.slug,
      memberName: card.member?.nameKr || card.member?.nameEn || 'Unknown',
      groupName: card.group?.nameKr || card.group?.nameEn || 'Unknown',
      imageUrl: card.imageUrl,
      thumbImagePath: card.thumbImagePath,
      cardName: card.cardName || 'Unknown',
      albumTitle,
      isOwned: userId ? userCardIds.has(card.id) : true,
    }));

    return (
      <AlbumGalleryClient
        albumId={albumId}
        albumTitle={albumTitle}
        cards={photocardItems}
      />
    );
  } catch (error) {
    console.error('[AlbumPage] Error:', error);
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">오류가 발생했습니다</h1>
          <p className="text-neutral-400 mb-4">도감을 불러올 수 없습니다</p>
          <a
            href="/gallery"
            className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
          >
            갤러리로 돌아가기
          </a>
        </div>
      </div>
    );
  }
}
