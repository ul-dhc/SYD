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

## NSRD analītiskais pārskats

5. solī darbvietai pievienots kopīgs `Tīkls` un `Pārskats` pārslēgs un NSRD principiem atbilstošs analītiskais pārskats:

- kopsavilkums parāda pašreizējās atlases ierakstus, izvēlētās lomas unikālās vērtības un atlasīto mezglu skaitu;
- SVG riņķa diagramma rāda pirmās piemērotās kategoriskās lomas sadalījumu;
- horizontālās joslas rāda otras piemērotās lomas biežākās vērtības;
- ierakstu diagramma salīdzina ierakstus pēc tiem piesaistīto vērtību skaita;
- kopparādīšanās matrica skaita vienas lomas vērtības, kas sastopamas kopā vienā ierakstā;
- mobilajā versijā matrica tiek aizstāta ar biežāko pāru sarakstu;
- klikšķis pārskatā maina to pašu mezglu atlasi, ko izmanto tīkls un detaļu panelis;
- pāra atlase izmanto nosacījumu `visi`, tāpēc tiek parādīti ieraksti, kuros sastopamas abas vērtības;
- filtri, paletes, standarta vai zīmuļa stils un četri kustības režīmi darbojas abos darbvietas režīmos.

Kopparādīšanās aprēķins atrodas `createCooccurrenceData()` datu kodolā. Tas saņem ģenerisku lomas identifikatoru, tāpēc nav piesaistīts personām vai kādam konkrētam datu kopas laukam.

Pārbaudīts, ka matricas pāra atlase pāriet uz tīklu un detaļu paneli, bet kopīgais filtrs pārrēķina visas pārskata diagrammas. Datora matrica un mobilais pāru saraksts pārbaudīts 360, 480, 820 un 1280 px platumā bez horizontālas lapas pārplūdes.

## Izolētais vizualizāciju CSS slānis

6. solī no datu sagatavošanas darbplūsmas nodalīti visi no NSRD pārņemtie vizualizāciju stili:

- `workspace.css` satur tikai datu sagatavošanas, kolonnu pārbaudes, jautājuma izvēles un rekomendāciju noformējumu;
- `visualization.css` ir vienīgais HTML pieslēgtais vizualizāciju CSS ieejas fails;
- tas sākotnējā kaskādes secībā ielādē darbvietas sistēmas moduli `visualization-system.css` un tīkla renderēšanas moduli `network.css`;
- vizualizāciju ietvars, filtri, detaļas, vadīklas, analītiskais pārskats un responsīvās atvilktnes atrodas vienā izolētā slānī;
- turpmākie SYD zīmola pielāgojumi var tikt pievienoti pēc kopīgās sistēmas, nemainot datu darbplūsmas stilus.

Šis sadalījums saglabā līdzšinējo CSS secību, tāpēc tīkla un pārskata vizuālais rezultāts nemainās. Vienlaikus tas novērš situāciju, kurā NSRD sistēmas noteikumi ir sajaukti ar SYD datu sagatavošanas lapas noteikumiem.

## SYD zīmola pielāgojumu slānis

7. solī pēc kopīgās vizualizāciju sistēmas pievienots `visualization-brand.css`. Tas sasaista vizualizācijas ar SYD pamatlapas virsmu, teksta, līniju un akcenta krāsām.

Pielāgojumu slānis nemaina datu paletes, mezglu formas, diagrammu ģeometriju, animācijas, izkārtojumu vai responsīvo uzvedību. Līdz ar to NSRD vizualizāciju principi paliek vienoti, bet SYD identitāte ir pārvaldāma vienā atsevišķā failā.

## NSRD paritātes pārbaude

8. solī visi tīkla, pārskata, filtru, stilu, kustību un responsīvās uzvedības principi pārbaudīti pret NSRD. Pārbaudes kontrolsaraksts, novērstās atšķirības un pārlūka pārbaudes rezultāti apkopoti failā `docs/nsrd-parity-audit.md`.
