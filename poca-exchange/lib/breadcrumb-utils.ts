import { BreadcrumbItem } from "@/components/breadcrumb";

/**
 * Generate breadcrumb items for a group page
 * Home > Wiki > GroupName
 */
export function getGroupBreadcrumbs(
  groupSlug: string,
  groupName: string
): BreadcrumbItem[] {
  return [
    { name: "Home", url: "/" },
    { name: "Wiki", url: "/wiki" },
    { name: groupName },
  ];
}

/**
 * Generate breadcrumb items for a member/album page within a group
 * Home > Wiki > GroupName > MemberName
 */
export function getMemberBreadcrumbs(
  groupSlug: string,
  groupName: string,
  memberSlug: string,
  memberName: string
): BreadcrumbItem[] {
  return [
    { name: "Home", url: "/" },
    { name: "Wiki", url: "/wiki" },
    { name: groupName, url: `/wiki/${groupSlug}` },
    { name: memberName },
  ];
}

/**
 * Generate breadcrumb items for an album page within a member
 * Home > Wiki > GroupName > MemberName > AlbumName
 */
export function getAlbumBreadcrumbs(
  groupSlug: string,
  groupName: string,
  memberSlug: string,
  memberName: string,
  albumName: string
): BreadcrumbItem[] {
  return [
    { name: "Home", url: "/" },
    { name: "Wiki", url: "/wiki" },
    { name: groupName, url: `/wiki/${groupSlug}` },
    { name: memberName, url: `/wiki/${groupSlug}/${memberSlug}` },
    { name: albumName },
  ];
}

/**
 * Generate breadcrumb items for a card detail page
 * Home > Cards > GroupName > MemberName > CardName
 */
export function getCardBreadcrumbs(
  groupName: string,
  groupSlug: string,
  memberName: string | null,
  memberSlug: string | null,
  cardName: string
): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [
    { name: "Home", url: "/" },
    { name: "Gallery", url: "/gallery" },
    { name: groupName, url: `/wiki/${groupSlug}` },
  ];

  // Add member if available
  if (memberName && memberSlug) {
    crumbs.push({
      name: memberName,
      url: `/wiki/${groupSlug}/${memberSlug}`,
    });
  }

  // Add card as final crumb (no URL)
  crumbs.push({ name: cardName });

  return crumbs;
}
