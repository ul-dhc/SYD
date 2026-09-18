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

## NSRD tīkla kodols

3. solī vienotajam datu un stāvokļu slānim pieslēgts NSRD principiem atbilstošs tīkla dzinējs:

- brīvais režīms izmanto determinētu sākuma izvietojumu un 95 spēku simulācijas iterācijas;
- hierarhiskais režīms katru datu lomu novieto savā rindā un kārto mezglus pēc saišu pakāpes;
- divdaļīgais režīms veido divas izvēlēto datu lomu kolonnas;
- kolonnas tiek kartētas uz piecām formām: aplis, rombs, noapaļots kvadrāts, trijstūris un sešstūris;
- mezgla izmērs atkarīgs no svērtās saišu pakāpes un izvēlētā izkārtojuma;
- saites beidzas pie mezgla ārmalas un pārvietojas reizē ar vilktu mezglu;
- brīvajā režīmā pieejama apturama dreifēšana un mezglu izkliedēšana;
- SVG izmanto NSRD klašu līgumu `network-edges`, `network-edge-base`, `network-edge-flow`, `network-nodes`, `graph-node` un `node-shape`;
- standarta un zīmuļa stils, piecas paletes un četri kustības režīmi darbojas visiem pieciem mezglu tipiem;
- datu slāņus var ieslēgt un izslēgt, nezaudējot sasaisti ar avota ierakstiem.

Animācija maina esošo SVG elementu koordinātas, nevis atkārtoti pārbūvē visu tīklu. Tas saglabā stabilu tastatūras fokusu, klikšķināšanu un mezglu vilkšanu.

## NSRD darbvietas struktūra

4. solī tīkla un citu vizualizāciju ietvars pārveidots par NSRD principiem atbilstošu darbvietu:

- datorā filtri, vizualizācija un detaļas veido `248 px / elastīgs laukums / 310 px` kolonnu izkārtojumu;
- abus sānu paneļus var neatkarīgi paslēpt, piešķirot vizualizācijai visu pieejamo platumu;
- filtru panelis parāda kopīgās meklēšanas un lauku atlases, kas ietekmē visas vizualizācijas;
- detaļu panelis sasaista atlasītos tīkla mezglus ar to datu lomām un avota ierakstiem;
- aktīvo filtru un atlasīto mezglu skaits redzams paneļu pogās;
- planšetē paneļi kļūst par 360 px sānu atvilktnēm;
- telefonā paneļi atveras no apakšas pilnā ekrāna platumā;
- vienlaikus var būt atvērta tikai viena kompaktā atvilktne, un to var aizvērt ar pogu vai aptumšoto fonu;
- paneļu vadīklas ir vismaz 44 px augstas.

Detaļu saturs tiek veidots no ģeneriskajām datu lomām un ierakstu identifikatoriem. Tajā nav NSRD laukiem piesaistītu nosaukumu vai nosacījumu.

Pārlūkā pārbaudīti 360, 480, 820 un 1280 px platumi. Visos platumos dokumenta platums sakrīt ar pārlūka loga platumu, un filtri, atlase un paneļu pārslēgšana darbojas ar reāliem klikšķiem.
