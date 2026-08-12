/**
 * group_members_final.csv was produced by an automated first-pass parse of
 * album/version names (Source: "1차_Version_Name_Parsing"), so alongside real
 * stage names it also picked up merch/packaging vocabulary and generic
 * English words (e.g. "Standard", "Jewel Case", "Poca Album", "Blue").
 * These aren't member names — exclude them so we don't create fake Members.
 *
 * This is a precision-first denylist (exact match, not substring) so real
 * repeated stage names like "Winter", "Mark", "Nana", "Yujin" are preserved.
 */
export const MEMBER_NAME_DENYLIST = new Set(
  [
    // packaging / format
    "standard", "limited", "normal", "deluxe", "special", "repackage",
    "regular", "random", "digital", "physical", "edition", "version", "ver",
    "type", "set", "package", "box", "case", "sleeve", "binder", "folder",
    "jewel", "platform", "kit", "lp", "cd", "dvd", "usb", "nfc", "qr",
    "kihno", "plve", "stayg", "kiwee", "cassette", "casette", "vinyl",
    "poca", "pocaalbum", "album", "albums", "photocard", "postcard",
    "sticker", "stickers", "poster", "booklet", "lyrics", "lenticular",
    "photobook", "book", "diary", "letter", "magazine", "archive", "record",
    "keyring", "badge", "pin", "folded", "unfolded", "promo", "weverse",
    "smtown", "fc", "store", "main", "unit", "chapter", "id", "name", "ep",
    "mini", "ost",

    // generic nouns / abstractions
    "memories", "memory", "moment", "reality", "dream", "wish", "love",
    "kiss", "break", "flash", "earth", "sky", "moon", "sun", "star", "wave",
    "side", "family", "culture", "capsule", "eclipse", "future", "classic",
    "all", "blu", "bag", "tiny", "hot", "ready", "live", "be", "color",
    "girls", "girl", "boy", "youth", "ray", "full", "dark", "like", "your",
    "korean", "photo", "raw", "fake", "sunlight", "moonlight", "urban",
    "noble", "barnes", "walmart", "sweet", "hello", "pop", "team", "play",
    "take", "outside", "inside", "bloom", "shadow", "soul",

    // colors
    "gray", "grey", "silver", "gold", "black", "white", "red", "blue",
    "green", "pink", "yellow", "purple", "orange", "cream",

    // time / place
    "night", "day", "dawn", "ever", "now", "japan", "taiwan", "china",
    "korea", "usa", "global", "worldwide",

    // stopwords
    "in", "on", "by", "with", "for", "to", "you", "it", "of", "that", "this",
    "from", "over", "up", "new", "only", "the", "and", "a", "an",

    // platforms
    "ktown4u", "makestar", "ktown", "applemusic", "spotify",

    // ambiguous surnames used as noise fillers (not real solo stage names here)
    "kim", "lee",

    // vinyl/single release formats (found polluting e.g. BTS, BLACKPINK, GOT7)
    "alternate", "disc", "epiphane", "flexi", "instrumental", "original",
    "picture", "shirt", "single", "snowflake", "swim", "digipak", "softpack",
    "hardcover", "collectible", "compact", "tape", "marble", "truck",
    "target", "tangerine", "creamsicle", "downpour", "plum", "avocado",
    "warner", "murakami", "powerpuff", "drawstring", "bunny", "body",
    "beach", "cross", "nest", "rats", "hits", "rev", "vers", "fans",
    "group", "got", "us", "pit", "fancy", "once", "girl", "number", "one",
    "kr", "et", "essay", "different", "paris", "japanese", "voice",
    "indie", "figure", "cap", "gift", "direct", "express", "tell", "can",
    "burst", "smcu", "smini", "nj", "cm", "amazon", "fnac", "atiny",
    "price", "flowers", "prelude", "silence", "postlude", "serenity",
    "rose", "quartz", "thailand", "taiwanese", "my", "tv", "baebae",
    "midnight", "tide", "hotel", "high", "big", "meadow", "sunny",

    // fandom names (not members)
    "carat", "engene", "midzy", "atiny", "once", "army", "blink", "moa",
    "reveluv", "ahgase", "exo-l", "stay",
  ].map((s) => s.toLowerCase())
);

export function isLikelyRealMemberName(raw: string, groupName: string): boolean {
  const name = raw.trim();
  if (name.length < 2 || name.length > 24) return false;
  if (/\d/.test(name)) return false;
  if (!/^[a-zA-Z .'-]+$/.test(name)) return false;
  if (MEMBER_NAME_DENYLIST.has(name.toLowerCase())) return false;

  // Reject self-referential rows, e.g. "aespa" or "NewJeans" parsed as a
  // "member" of their own group.
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (normalize(name) === normalize(groupName)) return false;

  return true;
}
