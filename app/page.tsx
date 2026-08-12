'use client'

import { useState } from 'react'

interface PhotocardItem {
  id: number
  name: string
  member: string
  group: string
  album: string
  source: string
  image: string
  description: string
  price: number
  priceChange: number
  inHand: number
  iso: number
  color: string
}

const PHOTOCARD_ITEMS: PhotocardItem[] = [
  {
    id: 1,
    name: '정국 Golden',
    member: '정국',
    group: 'BTS',
    album: 'Golden (POB)',
    source: 'POB',
    image: '💛',
    description: 'BTS Permission to Dance on Stage POB',
    price: 85000,
    priceChange: 12.5,
    inHand: 2,
    iso: 5,
    color: 'from-yellow-500 to-yellow-600',
  },
  {
    id: 2,
    name: '카리나 Armageddon',
    member: '카리나',
    group: 'aespa',
    album: 'Armageddon (POB)',
    source: 'POB',
    image: '❤️',
    description: 'aespa Armageddon Album POB',
    price: 75000,
    priceChange: -5.2,
    inHand: 3,
    iso: 8,
    color: 'from-red-500 to-red-600',
  },
  {
    id: 3,
    name: '펠릭스 런잇',
    member: '펠릭스',
    group: 'Stray Kids',
    album: 'Runaway Run Away 런어웨이',
    source: '럭드',
    image: '💚',
    description: 'Stray Kids Felix Luckydraw Card',
    price: 62000,
    priceChange: 8.3,
    inHand: 1,
    iso: 6,
    color: 'from-green-500 to-green-600',
  },
  {
    id: 4,
    name: '지수 Pink Venom',
    member: '지수',
    group: 'BLACKPINK',
    album: 'Pink Venom (POB)',
    source: 'POB',
    image: '💗',
    description: 'BLACKPINK Jisoo Album POB',
    price: 95000,
    priceChange: 15.7,
    inHand: 4,
    iso: 12,
    color: 'from-pink-500 to-pink-600',
  },
  {
    id: 5,
    name: '해인 Super Shy',
    member: '해인',
    group: 'NewJeans',
    album: 'Super Shy (POB)',
    source: 'POB',
    image: '💙',
    description: 'NewJeans Hanni Super Shy POB',
    price: 55000,
    priceChange: -2.1,
    inHand: 5,
    iso: 4,
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 6,
    name: '지민 Yet To Come',
    member: '지민',
    group: 'BTS',
    album: 'Yet To Come (POB)',
    source: 'POB',
    image: '💜',
    description: 'BTS Jimin Yet To Come Concert POB',
    price: 78000,
    priceChange: 10.2,
    inHand: 2,
    iso: 7,
    color: 'from-purple-500 to-purple-600',
  },
  {
    id: 7,
    name: '리사 Kill This Love',
    member: '리사',
    group: 'BLACKPINK',
    album: 'Kill This Love (럭드)',
    source: '럭드',
    image: '🖤',
    description: 'BLACKPINK Lisa Luckydraw Card',
    price: 88000,
    priceChange: 6.8,
    inHand: 1,
    iso: 9,
    color: 'from-slate-600 to-slate-700',
  },
  {
    id: 8,
    name: '민지 Hype Boy',
    member: '민지',
    group: 'NewJeans',
    album: 'NewJeans (POB)',
    source: 'POB',
    image: '⚪',
    description: 'NewJeans Hype Boy Album POB',
    price: 52000,
    priceChange: -3.4,
    inHand: 6,
    iso: 3,
    color: 'from-slate-200 to-slate-300',
  },
  {
    id: 9,
    name: '창빈 특전',
    member: '창빈',
    group: 'Stray Kids',
    album: '악뮤직 (특전)',
    source: '럭드',
    image: '🔴',
    description: 'Stray Kids Changbin Special Edition',
    price: 68000,
    priceChange: 13.5,
    inHand: 2,
    iso: 11,
    color: 'from-red-600 to-red-700',
  },
  {
    id: 10,
    name: '겸 Cozy',
    member: '겸',
    group: 'aespa',
    album: 'Cozy (POB)',
    source: 'POB',
    image: '🟠',
    description: 'aespa Giselle Cozy Album POB',
    price: 71000,
    priceChange: 9.1,
    inHand: 3,
    iso: 6,
    color: 'from-orange-500 to-orange-600',
  },
]

interface SearchFilters {
  group: string
  member: string
  source: string
  search: string
}

export default function Home() {
  const [filters, setFilters] = useState<SearchFilters>({
    group: 'all',
    member: 'all',
    source: 'all',
    search: '',
  })
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  const groups = [
    'all',
    ...Array.from(new Set(PHOTOCARD_ITEMS.map((item) => item.group))),
  ].sort()

  const members = [
    'all',
    ...Array.from(new Set(PHOTOCARD_ITEMS.map((item) => item.member))),
  ].sort()

  const sources = [
    'all',
    ...Array.from(new Set(PHOTOCARD_ITEMS.map((item) => item.source))),
  ]

  const filteredItems = PHOTOCARD_ITEMS.filter((item) => {
    const matchGroup = filters.group === 'all' || item.group === filters.group
    const matchMember = filters.member === 'all' || item.member === filters.member
    const matchSource = filters.source === 'all' || item.source === filters.source
    const matchSearch =
      filters.search === '' ||
      item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.member.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.group.toLowerCase().includes(filters.search.toLowerCase())
    return matchGroup && matchMember && matchSource && matchSearch
  })

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/50 border-b border-slate-700/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                StanPC
              </h1>
              <p className="text-slate-400 mt-2">K-Pop 포토카드 도감 | 최고의 컬렉션</p>
            </div>
          </div>
        </div>
      </header>

      {/* Filters & Search */}
      <section className="bg-gradient-to-b from-slate-900/50 to-transparent border-b border-slate-700/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search Bar */}
          <div className="mb-8">
            <input
              type="text"
              placeholder="포카 검색 (멤버명, 그룹명, 앨범명)..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="w-full px-6 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
            />
          </div>

          {/* Group Filters */}
          <div className="mb-4">
            <p className="text-sm text-slate-400 mb-2 font-semibold uppercase tracking-wider">그룹</p>
            <div className="flex flex-wrap gap-2">
              {groups.map((group) => (
                <button
                  key={group}
                  onClick={() => setFilters({ ...filters, group })}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    filters.group === group
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/50'
                      : 'bg-slate-700/40 text-slate-300 hover:bg-slate-700/60 border border-slate-600/30'
                  }`}
                >
                  {group === 'all' ? '전체' : group}
                </button>
              ))}
            </div>
          </div>

          {/* Member Filters */}
          <div className="mb-4">
            <p className="text-sm text-slate-400 mb-2 font-semibold uppercase tracking-wider">멤버</p>
            <div className="flex flex-wrap gap-2">
              {members.slice(0, 6).map((member) => (
                <button
                  key={member}
                  onClick={() => setFilters({ ...filters, member })}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    filters.member === member
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/50'
                      : 'bg-slate-700/40 text-slate-300 hover:bg-slate-700/60 border border-slate-600/30'
                  }`}
                >
                  {member === 'all' ? '전체' : member}
                </button>
              ))}
            </div>
          </div>

          {/* Source Filters */}
          <div>
            <p className="text-sm text-slate-400 mb-2 font-semibold uppercase tracking-wider">출처</p>
            <div className="flex flex-wrap gap-2">
              {sources.map((source) => (
                <button
                  key={source}
                  onClick={() => setFilters({ ...filters, source })}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    filters.source === source
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-lg shadow-yellow-500/50'
                      : 'bg-slate-700/40 text-slate-300 hover:bg-slate-700/60 border border-slate-600/30'
                  }`}
                >
                  {source === 'all' ? '전체' : source}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="group relative h-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 hover:border-slate-500 transition-all duration-300 hover:shadow-2xl cursor-pointer"
              style={{
                boxShadow: hoveredId === item.id
                  ? `0 0 30px ${item.color.includes('red') ? 'rgba(239, 68, 68, 0.4)' : item.color.includes('pink') ? 'rgba(236, 72, 153, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`
                  : 'none'
              }}
            >
              {/* Background gradient */}
              <div
                className={`absolute inset-0 opacity-0 group-hover:opacity-25 transition-opacity duration-300 bg-gradient-to-br ${item.color}`}
              />

              {/* Content */}
              <div className="relative h-full p-6 flex flex-col">
                {/* Image/Icon Area - Larger for Photocard */}
                <div className="mb-4 text-7xl text-center group-hover:scale-125 transition-transform duration-300">
                  {item.image}
                </div>

                {/* Title, Group, Member */}
                <div className="mb-4 flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-pink-400 uppercase tracking-wider bg-pink-400/20 px-2 py-1 rounded-full">
                      {item.group}
                    </span>
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider bg-blue-400/20 px-2 py-1 rounded-full">
                      {item.source}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {item.name}
                  </h3>
                  <p className="text-slate-300 font-medium text-sm mb-1">
                    {item.member}
                  </p>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    {item.album}
                  </p>
                </div>

                {/* Price & Change Section */}
                <div className="bg-slate-900/60 rounded-lg p-3 mb-3 border border-slate-700/50">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Est. Price</p>
                      <p className="text-2xl font-bold text-white">
                        {(item.price / 1000).toFixed(1)}K
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">변동률</p>
                      <p className={`text-lg font-bold ${item.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {item.priceChange >= 0 ? '📈' : '📉'} {Math.abs(item.priceChange).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* In Hand & ISO Section */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/50 text-center">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">In Hand</p>
                    <p className="text-2xl font-bold text-cyan-400">{item.inHand}</p>
                  </div>
                  <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/50 text-center">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">ISO</p>
                    <p className="text-2xl font-bold text-amber-400">{item.iso}</p>
                  </div>
                </div>

                {/* Hover Indicator */}
                <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-pink-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Bottom Border Glow */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-2xl font-semibold text-slate-400 mb-2">
              검색 결과가 없습니다
            </p>
            <p className="text-slate-500">다른 필터로 검색해보세요</p>
          </div>
        )}

        {/* Stats Footer */}
        <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="bg-gradient-to-br from-pink-900/40 to-pink-900/20 rounded-lg p-6 border border-pink-700/30">
            <p className="text-3xl font-bold text-pink-400">
              {filteredItems.length}
            </p>
            <p className="text-slate-400 mt-2 text-sm">포카</p>
          </div>
          <div className="bg-gradient-to-br from-purple-900/40 to-purple-900/20 rounded-lg p-6 border border-purple-700/30">
            <p className="text-3xl font-bold text-purple-400">
              {groups.length - 1}
            </p>
            <p className="text-slate-400 mt-2 text-sm">그룹</p>
          </div>
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-900/20 rounded-lg p-6 border border-blue-700/30">
            <p className="text-3xl font-bold text-blue-400">
              {members.length - 1}
            </p>
            <p className="text-slate-400 mt-2 text-sm">멤버</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-900/20 rounded-lg p-6 border border-yellow-700/30">
            <p className="text-3xl font-bold text-yellow-400">
              ₩{(PHOTOCARD_ITEMS.reduce((acc, item) => acc + item.price, 0) / 1000000).toFixed(1)}M
            </p>
            <p className="text-slate-400 mt-2 text-sm">총 추정가</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/30 bg-gradient-to-t from-slate-900 to-transparent mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-slate-400">
          <p>© 2024 StanPC. K-Pop 포토카드 도감 플랫폼</p>
          <p className="text-sm mt-2 text-slate-500">수집하고, 거래하고, 드리밍하세요</p>
        </div>
      </footer>
    </main>
  )
}
