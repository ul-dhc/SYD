# NSRD vizualizāciju sistēmas inventarizācija

Datums: 2026. gada 18. septembris

NSRD avota versija: `28e328e`

SYD salīdzinātā versija: `177c25e`

## Mērķis

Šis dokuments ir kontrolsaraksts NSRD vizualizāciju sistēmas sistemātiskai pārņemšanai SYD. Pirmajā solī SYD vizualizāciju kods netiek mainīts.

Secinājums: NSRD rezultātu nevar pārņemt tikai ar CSS. Noformējums ir cieši saistīts ar datu modeli, stāvokļiem, SVG struktūru, izkārtojumu algoritmiem un mijiedarbību. Pašreizējais SYD risinājums izmanto daļu NSRD klašu un krāsu, bet tā pamatā ir cita vizualizācijas uzbūve.

## Avota patiesības vietas

| Daļa | NSRD avots | Nozīme |
|---|---|---|
| Vizualizāciju loģika | `NSRD/app/explorer-client.tsx` | Datu atlase, tīkla veidošana, izkārtojumi, SVG, analītiskais pārskats, matrica un detaļas |
| Vizualizāciju stili | `NSRD/app/globals.css` | Krāsas, izmēri, stāvokļi, kustība, zīmuļa stils un responsīvais noformējums |
| UI komponenti | `NSRD/components/ui/` | Select, pogas, slēdži un citu vadīklu stāvokļi |
| Datu piemērs | `NSRD/data/nsrd-seque.json` | NSRD datu struktūra, uz kuras sistēma pārbaudīta |
| SYD pamata loģika | `SYD/src/app.js` | Datu ielāde, tipu noteikšana, ieteikumi, filtri un pašreizējās vizualizācijas |
| SYD tīkla loģika | `SYD/src/network.js` | Pašreizējais divu kolonnu tīkls |
| SYD vizualizāciju stili | `SYD/src/workspace.css`, `SYD/src/network.css` | Daļēji pārņemti NSRD stili |

## Kas veido NSRD vizualizāciju sistēmu

### 1. Kopīgais vizualizāciju stāvoklis

| Stāvoklis | NSRD | SYD pašlaik | Novērtējums |
|---|---|---|---|
| Kopīga filtrētā datu kopa | Tīkls, pārskats, matrica un ieraksti izmanto vienu atlasi | Filtri ietekmē pašreizējo vizualizāciju | Daļēji |
| Vizualizācijas režīms | `Tīkls` un `Pārskats` vienā darbvietā | Katrs ieteiktais modulis tiek atvērts atsevišķi | Atšķirīga realizācija |
| Mezgla tipu slāņi | Persona, artefakts, formāts, grupa, institūcija | Tikai divas izvēlētas kolonnas | Nav |
| Atlases loģika | `jebkurš` un `visi` vairāku mezglu atlasei | Vairāku mezglu atlase bez datu atlases loģikas | Daļēji |
| Izkārtojums | Brīvais, hierarhiskais, divdaļīgais | Brīvais, hierarhiskais, divdaļīgais | Nosaukumi atbilst, algoritmi neatbilst |
| Divdaļīgā tīkla puses | Brīvi izvēlami divi mezglu tipi | Brīvi izvēlamas divas datu kolonnas | Daļēji |
| Nosaukumu režīms | Aktīvie, visi, paslēpti | Aktīvie, visi, paslēpti | Atbilst pēc funkcijas |
| Nosaukumu izmērs | 100%, 125%, 150% | 85%, 100%, 120% | Neatbilst |
| Palete | Arhīvs, neons, rudens, pastelis, košums | Tās pašas piecas paletes | Daļēji, jāpārbauda visas krāsas |
| Stils | Standarta un zīmuļa | Standarta un zīmuļa | Daļēji, tikai diviem mezglu tipiem |
| Kustība | Nav, lietus, atbalss, vilnis | Nav, lietus, atbalss, vilnis | Daļēji, uzvedība nav pilnībā vienāda |
| Tīkla kustīgums | Dinamisks vai apturēts, lēna dreifēšana | Nav NSRD spēku kustības | Nav |
| Mērogs un pārbīde | Pogu, ritināšanas un vilkšanas vadība | Ir | Daļēji |
| Manuāls mezglu novietojums | Saglabājas visos izkārtojumos sesijas laikā | Ir pašreizējā izkārtojumā | Daļēji |
| Iestatījumu saglabāšana | Vairāki vizuālie un kustības iestatījumi | Tīkla un diagrammu iestatījumi glabājas atsevišķi | Daļēji |

### 2. Tīkla datu modelis un algoritmi

| Komponents | NSRD realizācija | SYD pašlaik | Novērtējums |
|---|---|---|---|
| Pilnais grafiks | Artefakts ir centrālais mezgls, kas saista personas, formātu, grupu un institūciju | Pāri starp divu kolonnu vērtībām | Atšķirīga realizācija |
| Saišu apkopošana | Saite glabā svaru un saistīto ierakstu identifikatorus | Saite glabā tikai ierakstu skaitu | Nav pilnībā |
| Brīvais izkārtojums | Determinēts sākuma izvietojums un 95 spēku simulācijas iterācijas | Divi koncentriski apļi | Nav |
| Hierarhiskais izkārtojums | Slāņi pēc mezglu tipa un pakāpes | Divas horizontālas rindas | Nav |
| Divdaļīgais izkārtojums | Tiek pārbūvēts grafiks diviem izvēlētiem tipiem | Divas vertikālas kolonnas | Daļēji |
| Mezgla forma | Aplis, rombs, noapaļots kvadrāts, trijstūris, sešstūris | Aplis un rombs | Nav pilnībā |
| Mezgla izmērs | Atkarīgs no saišu pakāpes un izkārtojuma | Atkarīgs no vērtības biežuma | Atšķirīga nozīme |
| Saišu ģeometrija | Taisnas saites, kas beidzas pie mezgla ārmalas | Līknes līdz mezgla centram | Neatbilst |
| Atlases rezultāts | Mezgls nosaka atbilstošo ierakstu kopu, vairākas atlases apvieno ar `jebkurš` vai `visi` | Atlase tikai izceļ kaimiņus | Nav |
| Izkliedēšana | Atsevišķa darbība brīvajam tīklam | Nav | Nav |
| Vilkšana | Mezgls velkams visos izkārtojumos, saites pārvietojas līdzi | Mezgls velkams, saites pārzīmējas | Jāpārbauda līdzvērtība |

NSRD funkciju avoti:

- `buildGraph()` veido daudzslāņu grafiku.
- `layoutNodes()` veido brīvo spēku izkārtojumu.
- `layoutHierarchically()` veido tipiem atbilstošus slāņus.
- `buildBipartiteGraph()` veido divdaļīgu grafiku.
- `NodeShape()` un `nodeRadius()` nosaka mezglu vizuālo semantiku.
- `eventIdsForNode()` sasaista mezglu atlasi ar ierakstiem.

### 3. Tīkla saskarne

| Daļa | NSRD | SYD pašlaik | Novērtējums |
|---|---|---|---|
| Vizualizācijas pārslēgs | Tīkls un pārskats | Nav vienotas pārslēgšanas joslas | Nav |
| Sānu filtri | Pastāvīgs panelis datorā, atvilktne mazākā ekrānā | Atverams `details` bloks virs vizualizācijas | Neatbilst |
| Detaļu panelis | Atlasītie mezgli, loģika un saistītie ieraksti | Vienas rindas kopsavilkums zem tīkla | Nav |
| Izkārtojuma vadīklas | Kontekstuālas, mainās pēc režīma | Vienmēr redzamas tās pašas vadīklas | Daļēji |
| Leģenda | Visi aktīvie mezglu tipi ar formu un krāsu | Tikai divas izvēlētās kolonnas | Nav pilnībā |
| Tukšais stāvoklis | Ierakstu un atlases konteksts | Mezglu un saišu skaits | Daļēji |
| Pieejamība | Tastatūras atlase, `aria` stāvokļi, samazinātas kustības režīms | Tastatūras atlase un samazinātas kustības CSS | Daļēji |

### 4. Analītiskais pārskats

| Daļa | NSRD | SYD pašlaik | Novērtējums |
|---|---|---|---|
| Kopsavilkuma rādītāji | Ieraksti, personas, atlasītie ieraksti | Ieraksti, unikālās vērtības, aktīvie filtri | Pielāgota nozīme |
| Formātu sadalījums | Interaktīvs SVG riņķis ar segmentiem | CSS `conic-gradient` riņķis | Neatbilst uzvedība un struktūra |
| Personu biežumi | Horizontālas joslas ar atlasi | Ģeneriskas kategoriju joslas | Daļēji |
| Artefaktu sadalījums | Kolonnas pēc dalībnieku skaita | Kolonnas pēc izvēlēta lauka vērtības | Atšķirīga nozīme |
| Sadarbību matrica | Pilna matrica datorā, biežāko pāru saraksts mobilajā versijā | Atsevišķa vienkāršota salīdzinājuma tabula | Nav |
| Kopīga atlase | Klikšķis maina tīklu, pārskatu, matricu, detaļas un ierakstus | Klikšķis pievieno lauka filtru | Daļēji |
| Kustības un zīmuļa stils | Vienādi piemērots visām pārskata diagrammām | Daļēji piemērots esošajiem elementiem | Daļēji |

NSRD komponentu avoti:

- `OverviewDashboard()` veido visu analītisko pārskatu.
- `CollaborationMatrixChart()` veido matricu un mobilo pāru sarakstu.
- `AnalyticsFooter()` parāda rezultāta apjomu un atlases darbību.
- `SelectionInspector()` parāda atlasīto mezglu loģiku.
- `ResultList()` parāda saistītos ierakstus.
- `EmptyInspector()` parāda sākuma stāvokli bez atlases.

### 5. CSS inventarizācija

| NSRD `app/globals.css` apgabals | Aptuvenās rindas | Pārņemšanas nosacījums |
|---|---:|---|
| Dizaina mainīgie, tēma un paletes | 56–103, 590–665 | Pārnest kā vienotu tokenu slāni, nevis atsevišķas krāsas |
| Darbvietas režģis un sānu paneļi | 174–194 | Vispirms jāievieš tā pati paneļu struktūra |
| Filtri un slāņu vadīklas | 195–216 | Jāatdala ģeneriskā filtru loģika no NSRD lauku nosaukumiem |
| Tīkla panelis, rīkjoslas un vadīklas | 217–261 | Nepieciešams atbilstošs DOM un stāvokļu klašu līgums |
| Analītiskais pārskats | 263–307 | Jāpārņem kopā ar pārskata komponentu struktūru |
| Sadarbību matrica | 309–328 | Jāpārņem kopā ar darbvirsmas un mobilo realizāciju |
| Pārskata kustība un zīmuļa stils | 331–349 | Jāpārņem pēc pamata diagrammu struktūras |
| Tīkla saites un kustība | 356–387 | Jāpārņem kopā ar NSRD saišu ģeometriju un stāvokļiem |
| Mezgli, formas un nosaukumi | 388–424 | Nepieciešami visi pieci mezglu tipi |
| Detaļas un ierakstu saraksts | 425–480 | Nepieciešams pilnais detaļu panelis |
| Responsīvie režīmi | 482–588 | Pārbaudīt kopā ar reālo paneļu struktūru |

Pašreizējie `workspace.css` un `network.css` nedrīkst kļūt par vēl vienu NSRD stilu kopiju. Pēc funkcionālā kodola pārņemšanas tiem jāpaliek tikai kā SYD ietvara un zīmola pielāgojumu slānim.

## Ko SYD drīkst un nedrīkst pārņemt

### Pārņemt bez pārveidošanas pirmajā ieviešanas reizē

- Tīkla izkārtojumu matemātiku.
- Mezgla formas, izmēra principus un saišu gala aprēķinu.
- Atlases stāvokļu modeli un `jebkurš` vai `visi` loģiku.
- Tīkla SVG klašu un datu atribūtu līgumu.
- Paletes, zīmuļa stilu, kustības un samazinātas kustības noteikumus.
- Pārskata, matricas, detaļu un ierakstu komponentu struktūru.
- Responsīvos lūzumpunktus un mobilo alternatīvu uzvedību.

### Pielāgot SYD vajadzībām

- NSRD fiksētos mezglu tipus aizstāt ar SYD lietotāja izvēlētu lomu kartējumu.
- `EventRecord` aizstāt ar ģenerisku ieraksta, mezgla un saites datu līgumu.
- NSRD tekstus aizstāt ar SYD saskarnes tekstiem.
- NSRD galveni, zīmolu, sadaļu `Par` un datu kopai specifiskos laukus nepārņemt.
- SYD vizualizācijas nosaukumu un `#id` saglabāt kā ārējo ietvaru.

## Nepieciešamais ģeneriskais datu līgums

NSRD kodolu nevar pieslēgt patvaļīgai tabulai, kamēr SYD nav izveidojis šo starpslāni:

```text
VisualizationRecord
  id
  fields

NodeRole
  id
  label
  shape
  paletteSlot
  sourceColumn
  multiValue

GraphNode
  id
  roleId
  label
  recordIds
  degree

GraphEdge
  source
  target
  weight
  recordIds
```

Šis līgums ļaus NSRD vizualizācijas principus izmantot dažādām humanitāro zinātņu datu kopām, nezaudējot sasaisti ar sākotnējiem ierakstiem.

## Migrācijas secība pēc inventarizācijas

1. Izveidot ģenerisko datu adapteri un vienotus vizualizācijas stāvokļus.
2. Pārnest tīkla kodolu ar nemainītu SVG un CSS klašu līgumu.
3. Pārnest NSRD rīkjoslu, paneļus, filtru uzvedību un detaļu apgabalu.
4. Pārnest analītisko pārskatu un sadarbību matricu.
5. Pārnest visu NSRD vizualizāciju CSS kā izolētu slāni.
6. Virs tā pievienot tikai SYD zīmola un ģenerisko datu pielāgojumus.
7. Pārbaudīt visas stāvokļu kombinācijas datorā un mobilajās ierīcēs.

## Pieņemšanas kritēriji turpmākajiem soļiem

- NSRD un SYD vienam un tam pašam testa grafikam veido vienādu mezglu un saišu skaitu.
- Visi pieci mezglu tipi izmanto tās pašas formas, krāsas un izmēra principu.
- Brīvais, hierarhiskais un divdaļīgais izkārtojums darbojas pēc tiem pašiem algoritmiem.
- Mezglus var reāli vilkt visos izkārtojumos, un saites pārvietojas tiem līdzi.
- Atlase ar `jebkurš` un `visi` dod pareizo ierakstu kopu.
- Tīkls, pārskats, matrica, detaļas un ieraksti reaģē uz vienu kopīgu atlasi.
- Visas piecas paletes darbojas standarta un zīmuļa stilā.
- Visas četras kustības izvēles darbojas tīklā un pārskatā.
- `prefers-reduced-motion` izslēdz dekoratīvo kustību.
- 360, 480, 820 un 1280 pikseļu platumā nav horizontālas lapas pārplūdes.
- Mobilajā versijā matrica kļūst par biežāko pāru sarakstu, bet paneļi kļūst par atvilktnēm.
- Vadīklas mobilajā versijā ir vismaz 44 pikseļus augstas.
- Vizualizācijas pilnekrāna režīms, nosaukums un `#id` turpina darboties SYD ietvarā.

## 1. soļa rezultāts

Inventarizācija parāda, ka daļēja CSS pārnešana nav turpināma kā pamata stratēģija. Nākamajā solī jāizveido ģenerisks datu un stāvokļu slānis, pēc tam NSRD vizualizācijas kodols jāpārnes kā saskaņots veselums. Esošais SYD tīkla un pārskata kods jāsaglabā tikai tik ilgi, kamēr jaunais kodols ir pārbaudīts, pēc tam tas jāaizstāj, nevis jāpapildina ar vēl vienu stilu slāni.
