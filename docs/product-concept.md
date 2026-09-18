# SYD – See Your Data

## Produkta koncepcija

- **Versija:** 0.1
- **Datums:** 2026. gada 18. septembris
- **Statuss:** sākotnējā koncepcija
**Plānotā adrese:** `https://dhc.lu.lv/seeyourdata`

> **A guided data explorer for humanities research.**

## 1. Kopsavilkums

SYD – See Your Data ir humanitāro zinātņu pētniekiem paredzēta vadīta datu izpētes un vizualizācijas vide. Tā palīdz cilvēkiem bez programmēšanas un padziļinātām datu analīzes prasmēm saprast savu datu struktūru, sagatavot datus izpētei, izvēlēties metodoloģiski piemērotas vizualizācijas un publicēt interaktīvus rezultātus.

SYD sākas nevis ar tehnisku jautājumu “Kādu diagrammu vēlaties?”, bet ar pētnieka jautājumu:

> Ko jūs vēlaties noskaidrot par saviem datiem?

Rīks apvieno trīs savstarpēji saistītas daļas:

- **SYD Guide** – humanitāro datu metodoloģiskais sarunu konsultants;
- **SYD Explorer** – lokāla datu sagatavošanas, izpētes un vizualizācijas vide;
- **SYD Library** – kurēta humanitāro datu metožu un vizualizāciju bibliotēka.

Pētniecības datu kopa pēc noklusējuma paliek lietotāja ierīcē. SYD Guide nevar piekļūt datu failam un saņem tikai to tekstu, ko lietotājs apzināti ieraksta sarunā. Publiskām vizualizācijām lietotājs var izvēlēties savu publiski pieejamo Google Sheet kā datu avotu; SYD datus nekopē un neglabā savā serverī.

## 2. Problēma

Humanitāro zinātņu pētniekiem bieži ir:

- Excel, CSV, TSV vai Google Sheets tabulās sakārtoti dati;
- nepilni, nevienmērīgi vai vēsturiski mainīgi dati;
- aptuveni datumi un neskaidras vērtības;
- vairākas personas, vietas vai kategorijas vienā laukā;
- atšķirīgas personvārdu, institūciju un vietvārdu formas;
- pētniecības jautājums, bet nav tehnisko zināšanu piemērotas metodes izvēlei;
- nepieciešamība izveidot vizualizāciju sākotnējai izpētei, publikācijai, prezentācijai vai publiskai komunikācijai.

Esošie datu rīki bieži pieņem, ka lietotājs jau zina datu tipus, analīzes terminoloģiju un vēlamo vizualizācijas formu. Tie ne vienmēr respektē humanitāro datu nenoteiktību, avotu kritiku un interpretatīvo raksturu.

SYD palīdz pētniekam iziet visu ceļu: no pētījuma jautājuma un datu apraksta līdz sagatavotam, interpretējamam un kopīgojamam skatam.

## 3. Mērķauditorija

SYD primāri paredzēts:

- vēsturniekiem;
- literatūras, valodas un kultūras pētniekiem;
- mākslas, mūzikas un teātra pētniekiem;
- arheologiem un kultūras mantojuma pētniekiem;
- arhīvu, bibliotēku un muzeju speciālistiem;
- digitālo humanitāro zinātņu studentiem un pasniedzējiem;
- pētniekiem, kuri strādā ar kultūras kolekciju un biogrāfiskiem datiem.

Atsevišķas metodes var būt noderīgas arī sociālo zinātņu pētniekiem, tomēr SYD pozicionējums, valoda un metodoloģija ir orientēta uz humanitāro zinātņu vajadzībām. SYD nav universāla biznesa analītikas vai statistikas platforma.

## 4. Galvenais solījums

> Aprakstiet savu pētniecības jautājumu un datu struktūru. SYD palīdzēs sagatavot datus un izvēlēties piemērotākās izpētes un vizualizācijas metodes – bez programmēšanas.

Īsais angļu valodas formulējums:

> Describe your research question and data structure. SYD will guide you towards suitable methods and visualisations – without programming.

## 5. Produkta pamatprincipi

### 5.1. Humanitāro datu specifika

SYD respektē:

- neskaidrību un pretrunas;
- aptuvenus un daļēji zināmus datumus;
- vēsturiskos un alternatīvos vietvārdus;
- dažādas personvārdu un institūciju formas;
- nepilnīgas ziņas;
- avotu, piezīmju un ticamības norāžu nozīmi;
- atšķirību starp “nav zināms”, “nav attiecināms” un tukšu vērtību;
- oriģinālās un normalizētās vērtības paralēlu saglabāšanu.

Datu neatbilstība netiek automātiski uzskatīta par kļūdu. “Netīrība” var būt pētnieciski nozīmīga informācija.

### 5.2. Pētnieks saglabā kontroli

SYD:

- nepārraksta oriģinālos datus;
- neizdomā trūkstošas vērtības;
- neapvieno personas, vietas vai institūcijas bez apstiprinājuma;
- parāda piedāvātās izmaiņas pirms to piemērošanas;
- ļauj darbības atsaukt;
- saglabā pārveidojumu vēsturi;
- skaidri nošķir avota vērtību no pārveidotās vērtības.

### 5.3. Privātums pēc noklusējuma

- Lokāli ielādēta datu kopa tiek apstrādāta lietotāja pārlūkā.
- Datu fails netiek nosūtīts SYD Guide vai LLM pakalpojumam.
- SYD Guide nepieņem failu pielikumus.
- SYD Guide saņem tikai sarunā apzināti ievadīto tekstu.
- Lietotājs tiek aicināts neievadīt reālus personas datus un vajadzības gadījumā izmantot tikai fiktīvus struktūras piemērus.
- Publiska Google Sheet izmantošana ir lietotāja apzināti izvēlēts publicēšanas režīms.

### 5.4. Metodoloģiska caurskatāmība

Katrai metodei un vizualizācijai SYD paskaidro:

- kādam pētniecības jautājumam tā ir piemērota;
- kādi dati ir nepieciešami;
- kā dati tiek pārveidoti;
- ko rezultāts var parādīt;
- ko no rezultāta nedrīkst secināt;
- kā nenoteiktība un trūkstošie dati var ietekmēt interpretāciju.

### 5.5. Zemas tehniskās prasības

Lietotājam nav jāprot programmēt, rakstīt vaicājumus vai pārzināt datu vizualizācijas terminoloģiju. Saskarne izmanto pētnieciskus jautājumus, piemērus un vadītu izvēli.

## 6. Produkta daļas

### 6.1. SYD Guide

SYD Guide ir humanitāro datu metodoloģiskais sarunu konsultants.

Tas palīdz:

- formulēt pētniecības jautājumu;
- aprakstīt, ko apzīmē viena datu rinda;
- noskaidrot kolonnu un vērtību nozīmi;
- izveidot datu sagatavošanas kontrolsarakstu;
- izvēlēties metodes no SYD Library;
- izskaidrot metožu priekšrocības un ierobežojumus;
- sagatavot SYD Explorer konfigurācijas projektu.

SYD Guide nav datu analīzes aģents. Tas:

- nevar piekļūt lietotāja datu kopai;
- nepieņem datu failus;
- nesaņem lokālās datu rindas vai datu profilu;
- neveic pārveidojumus datu kopā;
- nepalaiž kodu pār lietotāja datiem;
- nevar piedāvāt neeksistējošas SYD funkcijas;
- nepieņem pētnieciskus lēmumus lietotāja vietā.

Sarunas rezultāts ir strukturēts pētniecības un datu sagatavošanas plāns, nevis pārveidota datu kopa.

### 6.2. SYD Explorer

SYD Explorer ir lokālā darba vide, kurā pētnieks:

- ielādē CSV, TSV vai vēlāk XLSX datu kopu;
- apskata tabulas priekšskatījumu;
- pārbauda kolonnu tipus;
- identificē trūkstošas un atkārtotas vērtības;
- konfigurē vairāku vērtību atdalītājus;
- lokāli sagatavo un pārveido datus;
- izveido vizualizācijas;
- filtrē un salīdzina rezultātus;
- saglabā projektu savā ierīcē;
- eksportē vizualizācijas un atlasītos datus.

Visas datu pārveides izpilda determinēts SYD dzinējs no iepriekš definētu darbību saraksta. LLM ģenerēts patvaļīgs kods netiek izpildīts.

### 6.3. SYD Library

SYD Library ir kurēta humanitāro datu metožu un vizualizāciju bibliotēka.

Katram modulim ir:

- nosaukums un īss skaidrojums;
- piemēroti pētniecības jautājumi;
- nepieciešamie un izvēles datu lauki;
- datu sagatavošanas instrukcijas;
- pieejamie filtri un vizualizācijas;
- interpretācijas ierobežojumi;
- piemēra datu kopa;
- saite uz atbilstošo SYD Explorer konfigurāciju.

SYD Guide drīkst ieteikt tikai reāli pieejamus SYD Library moduļus.

## 7. Lietotāja ceļš

1. Pētnieks apraksta savu jautājumu SYD Guide.
2. Guide precizē, ko apzīmē viena datu rinda un kādi lauki ir pieejami.
3. Guide sagatavo datu prasību un sagatavošanas kontrolsarakstu.
4. Guide iesaka vienu līdz trīs piemērotus SYD Library moduļus.
5. Pētnieks atver izvēlēto moduli SYD Explorer.
6. Datu fails tiek ielādēts un apstrādāts lokāli.
7. SYD pārbauda, vai dati atbilst moduļa prasībām.
8. Pētnieks apskata un apstiprina datu sagatavošanas darbības.
9. SYD izveido vizualizāciju.
10. Pētnieks filtrē, salīdzina un interpretē rezultātu.
11. Projekts vai vizualizācija tiek saglabāta lietotāja ierīcē.
12. Ja dati ir paredzēti publiskai pieejai, pētnieks var izveidot kopīgojamu SYD skatu, kas izmanto publisku Google Sheet.

## 8. Sākotnējā SYD Library

### 8.1. Datu pārskats

- rindu un kolonnu skaits;
- trūkstošās vērtības;
- unikālās un atkārtotās vērtības;
- kategoriju biežums;
- iespējamie dublikāti;
- datumu un skaitļu diapazoni;
- datu sagatavošanas brīdinājumi.

### 8.2. Kategoriju salīdzinājums

- stabiņu diagramma;
- grupēts un slāņots salīdzinājums;
- proporcijas;
- krusttabula;
- siltuma karte.

### 8.3. Laiks

- laika līnija;
- notikumu skaits pa periodiem;
- kategoriju pārmaiņas laikā;
- sākuma un beigu datumu salīdzinājums;
- aptuvenu datumu attēlošana.

### 8.4. Saiknes

- brīvais tīkls;
- divdaļīgs tīkls;
- hierarhisks tīkls;
- sadarbības matrica;
- saišu stiprums;
- atlasīto mezglu kopīgie objekti.

### 8.5. Ierakstu pārlūks

- filtrējama tabula;
- ierakstu saraksts;
- kartīšu vai galerijas skats;
- atsevišķa ieraksta detaļas;
- atlasīto datu lejupielāde.

### 8.6. Nākamie moduļi

- punkti un plūsmas kartē;
- vietu salīdzinājums;
- vienkārša teksta korpusa izpēte;
- vairāku tabulu sasaistīšana;
- secību un plūsmu vizualizācijas.

## 9. Publisku vizualizāciju modelis

### 9.1. Pamatprincips

SYD neglabā lietotāja publiskos datus. Lietotājs var izvēlēties publiski pieejamu Google Sheet kā datu avotu, bet viena statiska SYD lietotne pārlūkā izveido saglabāto vizualizāciju.

```text
Publisks Google Sheet
        ↓
SYD nolasa publiski pieejamos datus
        ↓
Vizualizācija tiek izveidota skatītāja pārlūkā
        ↓
Kopīgojama SYD saite
```

### 9.2. Kopīgojamā saite

Kopīgojamā saite varētu izskatīties šādi:

```text
https://dhc.lu.lv/seeyourdata/view/#p=...
```

Saites fragmentā pēc `#` tiek glabāta saspiesta un versēta konfigurācija:

- Google Sheet identifikators;
- konkrētās lapas `gid`;
- izvēlētais SYD modulis;
- kolonnu piesaiste;
- filtri;
- krāsas, izkārtojums un citi skata iestatījumi.

Datu rindas saitē netiek ievietotas. Konfigurācijai nav nepieciešama SYD datubāze, lietotāja konts vai atsevišķas lapas ģenerēšana serverī.

### 9.3. Live view

Live view katrā atvēršanas reizē nolasa aktuālo publiskā Google Sheet saturu. Ja avota īpašnieks tabulu papildina vai izlabo, vizualizācija mainās.

Publiskajā skatā skaidri jānorāda:

> Live data – the visualisation reflects the current contents of the linked Google Sheet.

### 9.4. Snapshot

Reproducējamībai pētnieks var saglabāt konkrētā brīža rezultātu savā ierīcē:

- SYD projekta JSON;
- izmantoto vai filtrēto datu CSV;
- vizualizācijas SVG vai PNG;
- datu avota saiti;
- izveides datumu;
- izmantoto pārveidojumu un konfigurācijas aprakstu.

Pirmajā versijā snapshot netiek hostēts SYD serverī.

### 9.5. Publicēšanas nosacījumi

Pirmajā versijā SYD atbalsta tikai nepārprotami publiskus Google Sheets avotus. Privātām tabulām netiek veidota Google OAuth autorizācija.

Pirms kopīgojamā skata izveides lietotājs apstiprina:

> I confirm that this Google Sheet is intended for public access and that I have the right to publish its contents.

Ja avota īpašnieks pārtrauc publisko pieeju, SYD vizualizācija vairs nevar ielādēt datus.

## 10. Izmaksu un uzturēšanas modelis

SYD pirmajai versijai paredzēta statiska un pēc iespējas vienkārša infrastruktūra.

| Komponents | Nodrošinātājs | SYD izmaksu raksturs |
|---|---|---|
| SYD Explorer un publiskais skatītājs | GitHub Pages | bez tiešām izmaksām sākotnējā apjomā |
| Lietotāja publiskie dati | Google Sheets | datus uztur pats lietotājs |
| Vizualizācijas aprēķini | lietotāja pārlūks | nav servera aprēķinu izmaksu |
| Vizualizācijas konfigurācija | kopīgojamās saites fragments | nav datubāzes izmaksu |
| Lietotāju konti | nav nepieciešami | nav autorizācijas infrastruktūras |
| Failu glabāšana | nav nepieciešama | nav glabāšanas izmaksu |
| SYD Guide | LLM API | vienīgais mainīgo izmaksu komponents |

LLM izmaksas jāierobežo atsevišķi ar īsām vadītām sarunām, izmantošanas limitiem un strukturētu SYD Library kontekstu. SYD Explorer un publiskais skatītājs var darboties neatkarīgi no Guide pieejamības.

## 11. Pirmā versija

SYD 0.1 ietver:

- NSRD/Seque demonstrācijas projektu;
- CSV un TSV ielādi;
- datu priekšskatījumu;
- kolonnu konfigurēšanu;
- datu kvalitātes pārskatu;
- vairāku vērtību sadalīšanu;
- tīkla, laika un kategoriju vizualizācijas;
- filtrējamu ierakstu sarakstu;
- kopīgus filtrus dažādiem skatiem;
- projekta saglabāšanu un atkārtotu atvēršanu;
- SVG, PNG, CSV un projekta JSON eksportu;
- publiska Google Sheet pieslēgšanu;
- kopīgojamas live view saites;
- latviešu un angļu saskarni;
- sākotnējo SYD Library;
- SYD Guide prototipu bez datu failu piekļuves.

## 12. Kas pirmajā versijā netiek veidots

- lietotāju konti;
- datu kopu glabāšana SYD serverī;
- pētniecības datu nosūtīšana LLM;
- privātu Google Sheets autorizācija;
- serverī glabātas vizualizāciju konfigurācijas;
- publiskas koprediģēšanas iespējas;
- automātiska trūkstošo datu aizpildīšana;
- automātiska personu vai vietu identificēšana;
- universāla statistiskās analīzes platforma;
- brīvi izpildāms LLM ģenerēts kods;
- garantēta ilgtermiņa datu arhivēšana.

## 13. Tehniskās un drošības robežas

- Ārējiem datu avotiem nosaka maksimālo rindu, kolonnu un lejupielādes apjomu.
- Sheet šūnās ievietots HTML vai JavaScript nekad netiek izpildīts.
- Ārējās saites tiek validētas un atvērtas drošā režīmā.
- Datu tipi tiek validēti pirms vizualizācijas izveides.
- Ja avots nav pieejams vai ir mainījis struktūru, lietotājs saņem saprotamu kļūdas skaidrojumu.
- Datu avots un pēdējās ielādes laiks ir redzams publiskajā skatā.
- Lokālā datu kopa netiek padota SYD Guide komponentam.
- SYD Guide API nepieņem failus, datu rindas vai datu kopas objektus.
- Visas automātiskās datu pārveides ir iepriekš definētas, pārskatāmas un atsaucamas.

## 14. Veiksmes kritērijs

SYD ir izdevies, ja humanitāro zinātņu pētnieks bez programmēšanas pieredzes var:

1. formulēt savu pētniecības vajadzību;
2. saprast, kā jāsagatavo dati;
3. izvēlēties metodoloģiski piemērotu vizualizāciju;
4. izveidot un izpētīt to bez programmētāja palīdzības;
5. saprast rezultāta ierobežojumus;
6. saglabāt rezultātu, neatdodot savu privāto datu kopu SYD vai LLM;
7. pēc apzinātas izvēles publicēt interaktīvu skatu no publiska Google Sheet;
8. atjaunot publicēto vizualizāciju, mainot tikai savu Google Sheet.

## 15. Attīstības posmi

### 1. posms – universāls SYD kodols

- atdalīt pašreizējo NSRD datu modeli no vizualizācijas dzinēja;
- definēt universālu SYD projekta un datu modeli;
- saglabāt NSRD kā demonstrācijas projektu;
- pārbaudīt kodolu ar otru, no NSRD atšķirīgu datu kopu.

### 2. posms – lokālā datu darba vide

- CSV/TSV imports;
- kolonnu konfigurēšanas vednis;
- datu kvalitātes pārskats;
- pārveidojumu priekšskatījums un atsaukšana;
- projekta saglabāšana un eksports.

### 3. posms – SYD Library

- metožu aprakstu shēma;
- pirmie datu pārskata, laika, kategoriju un tīklu moduļi;
- metodoloģiskie ierobežojumi un piemēru projekti;
- moduļu atvēršana ar gatavu Explorer konfigurāciju.

### 4. posms – SYD Guide

- vadīta saruna par pētījuma jautājumu un datu struktūru;
- strukturēta SYD Library moduļu ieteikšana;
- datu sagatavošanas kontrolsaraksts;
- tehniski garantēta datu failu nepieejamība LLM.

### 5. posms – publiskie skati

- publiska Google Sheet pieslēgšana;
- konfigurācijas saglabāšana URL fragmentā;
- live view skatītājs;
- datu avota un atjaunošanas statusa norāde;
- kopīgojamās saites pārbaude.

### 6. posms – paplašināšana

- kartes un telpiskie dati;
- vairāku tabulu sasaistīšana;
- jauni SYD Library moduļi;
- veiktspējas optimizācija lielākām datu kopām;
- lietojamības pārbaudes ar dažādu humanitāro disciplīnu pētniekiem.

## 16. Publiskais apraksts

### Latviski

> **SYD – See Your Data** ir vadīta humanitāro datu izpētes un vizualizācijas vide. Aprakstiet savu pētniecības jautājumu, izvēlieties piemērotu metodi un izpētiet savus datus bez programmēšanas. Privāta datu kopa paliek jūsu ierīcē; publiskai vizualizācijai varat izmantot savu publiski pieejamo Google Sheet.

### English

> **SYD – See Your Data** is a guided data exploration and visualisation environment for humanities research. Describe your research question, choose an appropriate method, and explore your data without programming. Your private dataset stays on your device; for a public visualisation, you can connect your own publicly available Google Sheet.

## 17. Galvenais privātuma formulējums

### Latviski

> Jūsu privātā pētniecības datu kopa paliek pārlūkā. SYD Guide tai nevar piekļūt un saņem tikai to tekstu, ko jūs apzināti ierakstāt sarunā. Publisks SYD skats izmanto tikai tādu Google Sheet, kuru pats īpašnieks ir padarījis publiski pieejamu.

### English

> Your private research dataset stays in your browser. SYD Guide cannot access it and only receives the text you deliberately enter into the conversation. A public SYD view uses only a Google Sheet that its owner has intentionally made publicly accessible.

## 18. Atsauces sākotnējai izstrādei

- [Palladio](https://hdlab.stanford.edu/palladio/) – tabulāru humanitāro datu izpētes un vizualizācijas precedents.
- [Google Sheets as a data source](https://developers.google.com/chart/interactive/docs/spreadsheets) – publiska Google Sheet izmantošana tīmekļa vizualizācijās.
- [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) – statiskas vietnes publicēšanas robežas.
- [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data) – LLM sarunas datu apstrādes nosacījumi, kas jāņem vērā SYD Guide.
- [European Commission: GDPR principles](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/principles-gdpr_en) – datu minimizācijas un privātuma pēc noklusējuma principi.
