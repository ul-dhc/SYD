# NSRD un SYD vizualizāciju paritātes pārbaude

Pārbaude veikta pēc NSRD vizualizāciju sistēmas pārnešanas uz SYD. Mērķis ir saglabāt tās pašas vizualizāciju uzvedības un noformējuma pamatprincipus, vienlaikus izmantojot ģeneriskas datu lomas un SYD zīmola slāni.

## Pārbaudītā paritāte

| Joma | Rezultāts |
| --- | --- |
| Brīvais, hierarhiskais un divdaļīgais tīkls | Atbilst |
| Mezglu vilkšana un saišu galapunktu pārvietošana | Atbilst |
| Saistīto mezglu elastīgā reakcija brīvajā tīklā | Atbilst |
| Tīkla pārbīde, mērogošana, izkliedēšana un atiestatīšana | Atbilst |
| Nosaukumu režīmi un izmēri | Atbilst |
| Datu slāņu ieslēgšana un izslēgšana | Atbilst |
| Filtri, vairāku mezglu atlase un detaļu panelis | Atbilst |
| Analītiskais pārskats un kopparādīšanās matrica | Atbilst |
| Standarta un zīmuļa stils | Atbilst |
| Kustības režīmi `Nav`, `Lietus`, `Atbalss` un `Vilnis` | Atbilst |
| Piecas NSRD krāsu paletes | Atbilst |
| 360, 480, 820 un 1280 px izkārtojumi | Atbilst |
| Samazinātas kustības iestatījums | Atbilst |

## 8. solī novērstās atšķirības

- Tīkla vadīklas pie 1280 px vairs nenonāk zem detaļu paneļa un tiek kārtotas divās rindās, ja vizualizācijas laukums ir šaurāks par 900 px.
- `Neons`, `Dzintars`, `Pastelis` un `Košums` tagad izmanto tās pašas lomu krāsas kā NSRD.
- Palešu definīcijas apvienotas failā `visualization-palettes.js`, ko izmanto tīkls, pārskats un palešu pogas.
- Pārskata animācijas atkal izmanto NSRD elementu secības nobīdes un atbilstošos lietus, viļņa un atbalss efektus.
- Klikšķis tīkla tukšajā vietā noņem atlasi.
- Brīvajā tīklā vilkts mezgls elastīgi ietekmē tieši saistītos mezglus.

## Pārbaudes dati

Parauga datu kopā pārbaudīti 41 tīkla mezgls un 196 saites. Analītiskajā pārskatā pārbaudītas 3 kopsavilkuma vērtības, 4 riņķa diagrammas segmenti, 4 joslas, 8 ierakstu kolonnas un 16 matricas šūnas.

Pie 360, 480, 820 un 1280 px dokumenta platums sakrīt ar pārlūka platumu. Telefonā matrica tiek aizstāta ar pāru sarakstu, bet filtru un detaļu paneļi darbojas kā savstarpēji izslēdzošas 360 px atvilktnes. Pārlūka konsolē kļūdas netika konstatētas.

SYD nepārņem NSRD projekta valodu un tumšā režīma vadīklas, jo tās pieder NSRD lietotnes ietvaram, nevis vizualizāciju kodolam.

## Darbvietas ietvara atkārtota pārbaude

Atkārtoti salīdzinot abus projektus vienādā 1800 × 1376 px izmērā, pārnestas arī iepriekš trūkstošās NSRD darbvietas daļas:

- datu slāņu izvēles pārvietotas uz filtru paneli;
- noņemta tukšā papildu vadīklu josla virs tīkla;
- pievienots filtrēto un atlasīto ierakstu saraksts zem vizualizācijas;
- detaļu panelim pārņemts NSRD tukšais stāvoklis, atlases kopsavilkums un vairāku mezglu loģika;
- paletes, tīkla kustība, mezglu forma, stils un animācija apvienoti zem galvenes iestatījumu ikonas;
- atjaunoti atsevišķi punktu un teksta izmēra slīdņi;
- filtru, vizualizācijas un detaļu paneļu atstarpes un platumi pielīdzināti NSRD;
- 390 × 844 px un 1800 × 1376 px pārbaudē nav horizontālas pārplūdes.
