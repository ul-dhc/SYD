# SYD vizualizāciju kodols

2. solī ieviests kopīgs datu un stāvokļu slānis visām SYD vizualizācijām.

## Datu adapteris

`src/visualization-data.js` pārveido apstiprinātu tabulu četros savstarpēji saistītos līmeņos:

1. avota rinda kļūst par ierakstu ar stabilu identifikatoru;
2. izmantotā kolonna kļūst par lomu ar nosaukumu, formu un paletes vietu;
3. katra unikālā vērtība kļūst par mezglu ar avota ierakstu identifikatoriem;
4. vienā ierakstā sastopamas vērtības veido saiti ar svaru un avota ierakstu identifikatoriem.

Adapteris atbalsta vienas vērtības laukus, vairākas ar semikolu vai vertikālo svītru atdalītas vērtības, divdaļīgu grafiku un daudzslāņu grafiku. Tas neietver NSRD lauku nosaukumus.

## Kopīgais stāvoklis

`src/visualization-state.js` vienuviet glabā:

- meklēšanu un filtrus;
- redzamās datu lomas;
- atlasītos mezglus un atlases loģiku `jebkurš` vai `visi`;
- tīkla izkārtojumu un divdaļīgā tīkla lomas;
- tīkla vai pārskata režīmu;
- paleti, standarta vai zīmuļa stilu un kustību;
- nosaukumu režīmu un izmēru;
- mērogu, pārbīdi un manuāli mainītās mezglu pozīcijas.

Stāvoklis pārbauda atļautās izvēles un pēc kolonnu ieslēgšanas, izslēgšanas vai tipa maiņas izņem nederīgas lomas, filtrus un atlasi.

## Pašreizējais pieslēgums

- Visi SYD filtri izmanto lomu identifikatorus, nevis atsevišķu vizualizāciju lokālus filtrus.
- Datu pārskats, biežumu diagrammas, salīdzinājums, tīkls un ierakstu tabula saņem vienu filtrēto ierakstu kopu.
- Divdaļīgā tīkla mezgli un saites tiek aprēķināti ar ģenerisko adapteri.
- Tīkla un pārskata palete, stils un kustība izmanto vienu stāvokli un vienu pārlūka iestatījumu ierakstu.
- Tīkla izkārtojums, nosaukumu režīms, nosaukumu izmērs, mērogs, pārbīde un mezglu pozīcijas vairs netiek glabātas atsevišķā tīkla stāvoklī.

## Pārbaudes

`tests/visualization-core.test.mjs` pārbauda datu lomas, stabilus ierakstu identifikatorus, vairāku vērtību laukus, meklēšanu, filtrus, divdaļīgo un daudzslāņu grafiku, avota ierakstu sasaisti, atlases loģiku un stāvokļa pielāgošanu datu struktūras izmaiņām.

Nākamais solis ir pieslēgt šim kodolam NSRD tīkla algoritmus un nemainīto SVG klašu līgumu.
