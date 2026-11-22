# Zora Films · Guru Dev

Paket sadrži gotovu stranicu za postojeći GitHub repozitorij i Cloudflare Pages projekt `zora-guruji`.

## Postavljanje

1. Raspakiraj `Guru Dev.zip`.
2. U lokalnom repozitoriju `Zora-Guruji` zamijeni mapu `public` i dvije datoteke `DEPLOY-ZORA-FILMS.md` i `ORIGINAL-VERIFY-SHA256.txt` onima iz paketa. Mapa `.git` treba ostati u korijenu repozitorija.
3. U GitHub Desktopu odaberi **Commit to main** i **Push origin**.

U postojećem projektu Cloudflare Pages produkcijska je grana `main`, framework `None`, naredba za build `exit 0`, a izlazna mapa `public`. Datoteka `public/index.html` mora biti neposredno unutar te mape.

## Animacija i filmovi

Oba prijelaza, u sekcijama *Rooted in Minimalism* i *Analog Softness*, slijede položaj skrola u oba smjera. Podloga, tekst i tekstura koriste zajedničke koordinate. Telefon zadržava svoj raspored mozaika i portretni showreel. Položeni i uspravni showreel ostaju u izvornoj rezoluciji od 1920 × 1080 odnosno 1080 × 1920 piksela.

Showreel i osam galerijskih klipova reproduciraju izvorni tihi MP4 unutar stranice u petlji. Ako preglednik odbije reprodukciju ili dekoder zastane, na istom se mjestu pokreće animirani WebP napravljen od cijelog istog snimljenog materijala pri 25 sličica u sekundi. Rezervna petlja preuzima se po potrebi. Postavka smanjenog kretanja čuva statične postere mozaika, kao na izvornom desktopu.

Početna, kontakt i pojedinačni projekti koriste isti programski paket. Imena aktivnih skripti i stilova sadrže oznaku izdanja radi osvježavanja predmemorije nakon objave.

## Provjera datoteka

Popis SHA-256 obuhvaća sve datoteke u `public/`. U korijenu raspakiranog paketa možeš pokrenuti `shasum -a 256 -c ORIGINAL-VERIFY-SHA256.txt` na macOS-u ili `sha256sum -c ORIGINAL-VERIFY-SHA256.txt` na Linuxu.
