# Ötödölő – Amőba (öt egy sorban)

Böngészőben futó **amőba / gomoku** játék két játékosnak, egy gépen felváltva
(pass-and-play). Nincs szükség szerverre vagy telepítésre – tiszta
HTML + CSS + JavaScript.

## Szabályok

- Két játékos felváltva rakja a jelét: **✕** és **◯**.
- Aki előbb rak össze **öt egyforma jelet egy sorban** – vízszintesen,
  függőlegesen vagy átlósan –, az nyeri a játszmát.
- A győztes vonal kiemelődik a táblán.

## Funkciók

- Választható táblaméret: 15×15, 19×19, 20×20.
- Élő pontszám a két játékos között (több játszmán át).
- Átnevezhető játékosok.
- Utolsó lépés visszavonása (`↶ Vissza`) – győzelmet is visszavon.
- Aktuális játékos kijelzése és „szellem” előnézet a mezőkön hover-re.

## Futtatás

Csak nyisd meg az `index.html` fájlt egy böngészőben. Vagy egy egyszerű
helyi szerverrel:

```bash
python3 -m http.server 8000
# majd: http://localhost:8000
```

## Fájlok

- `index.html` – szerkezet és UI
- `style.css` – megjelenés
- `script.js` – játéklogika (lépések, győzelem-ellenőrzés, pontszám)
