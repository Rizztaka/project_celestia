# Section 4 artwork sources

The image index and presentation metadata reuse the progression catalog's pinned
[genshin-db commit 49a6544](https://github.com/theBowja/genshin-db/tree/49a6544a6c6ae36089cb42fa591fc46f01de8bcf).
No upstream code executes. The existing [MIT notice](../../third-party/genshin-db-LICENSE.txt)
is retained. Game artwork is fetched externally; the source-data license does not
grant ownership of HoYoverse artwork.

- [Character icon filenames](https://github.com/theBowja/genshin-db/blob/49a6544a6c6ae36089cb42fa591fc46f01de8bcf/src/data/image/characters.json)
- [Weapon icon filenames](https://github.com/theBowja/genshin-db/blob/49a6544a6c6ae36089cb42fa591fc46f01de8bcf/src/data/image/weapons.json)
- English character/weapon data in that same commit supplies names, elements,
  weapon categories and rarity. Unknown keys retain a neutral crest without an
  invented element or rarity.

`apps/api/tooling/build-artwork.mjs` reads the existing `source-data.json` cache
plus `images-characters.json` and `images-weapons.json`, downloaded from those
exact pinned URLs. It rejects missing filenames and unexpected source commits.
Run it with the explicit cache directory, then run Prettier on the two generated
web files. It outputs 147 character keys/Traveler variants and 254 weapon keys,
including compatibility aliases. All 122 progression characters and 252
progression weapons have mappings and metadata. This is coverage of the pinned
catalog, rather than a promise about future game releases.

SHA-256 of the locally serialized image indexes used in this run:

```text
characters: 4730ab21d7c48ba130dae416513a8ee6ac7f1f28bd78fd74e3dac104cd6009fb
weapons:    72764bccf56455f84aa28e2cc0258fcc8d6349256639a3b3bff51862f527b809
```

Enka is attempted first, followed by Ambr. Both image errors and eight-second
visible-image stalls advance the attempt. Local SVG motifs and gradients remain
visible while loading, after failure and for unknown keys. Lazy images outside
the viewport do not start a timeout. No new dependencies, icon font or image
generation are required.
