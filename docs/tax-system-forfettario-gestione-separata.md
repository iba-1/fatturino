# Sistema Fiscale: Regime Forfettario + Gestione Separata INPS
> Guida tecnica per partite IVA professioniste — aggiornata 2025/2026

---

## Indice

1. [Basi del regime forfettario](#1-basi-del-regime-forfettario)
2. [La catena di calcolo completa](#2-la-catena-di-calcolo-completa)
3. [Gestione Separata INPS](#3-gestione-separata-inps)
4. [Imposta Sostitutiva](#4-imposta-sostitutiva)
5. [Struttura dei pagamenti: acconti e saldo](#5-struttura-dei-pagamenti-acconti-e-saldo)
6. [Scadenze e codici F24](#6-scadenze-e-codici-f24)
7. [Scenari concreti multi-annuali](#7-scenari-concreti-multi-annuali)
8. [Metodo storico vs previsionale](#8-metodo-storico-vs-previsionale)
9. [Errori comuni e trappole](#9-errori-comuni-e-trappole)

---

## 1. Basi del Regime Forfettario

Il regime forfettario è un regime fiscale agevolato per persone fisiche con ricavi annui sotto una soglia (85.000 € dal 2023). Non si detraggono i costi analitici: al loro posto si applica un **coefficiente di redditività** che varia per codice ATECO.

### Coefficienti di redditività principali

| Categoria ATECO                                                       | Coefficiente |
| --------------------------------------------------------------------- | ------------ |
| Professionisti (consulenti, sviluppatori, designer, copywriter, ecc.) | **78%**      |
| Commercio al dettaglio e riparazione                                  | 40%          |
| Commercio ambulante alimentari                                        | 40%          |
| Commercio ambulante altri                                             | 54%          |
| Servizi alloggio e ristorazione                                       | 40%          |
| Altre attività economiche                                             | 67%          |
| Costruzioni e attività immobiliari                                    | 86%          |

> **Nota:** Il coefficiente 78% è quello tipico per i liberi professionisti senza cassa previdenziale di categoria (architetti, avvocati, ingegneri hanno le loro casse; queste note riguardano chi è in **Gestione Separata INPS**).

### Chi è in Gestione Separata?

Professionisti senza albo o con albo ma senza cassa previdenziale propria: sviluppatori software, consulenti IT, copywriter, grafici, social media manager, fotografi, e molte altre categorie. Non commercianti né artigiani.

---

## 2. La Catena di Calcolo Completa

Questa è la sequenza **obbligatoria** per calcolare tutto:

```
Fatturato lordo
  × Coefficiente di redditività (es. 78%)
  = Reddito imponibile lordo

Reddito imponibile lordo
  × Aliquota INPS (26,07%)
  = Contributi INPS annui dovuti

Reddito imponibile lordo
  − Contributi INPS effettivamente versati nell'anno¹
  = Base imponibile netta (per l'imposta sostitutiva)

Base imponibile netta
  × Aliquota imposta sostitutiva (15% ordinaria | 5% primi 5 anni)
  = Imposta sostitutiva annua
```

> ¹ I contributi INPS sono **l'unica spesa deducibile** nel regime forfettario. Attenzione: si deducono i contributi **versati nell'anno fiscale**, non quelli competenti. Questo crea asimmetrie nei primi anni.

---

## 3. Gestione Separata INPS

### Aliquota 2025/2026: **26,07%**

| Componente                                    | Aliquota   |
| --------------------------------------------- | ---------- |
| IVS (invalidità, vecchiaia, superstiti)       | 25,00%     |
| Maternità, malattia, degenze ospedaliere      | 0,72%      |
| ISCRO (indennità straordinaria discontinuità) | 0,35%      |
| **Totale**                                    | **26,07%** |

### Caratteristiche specifiche (diverso da artigiani/commercianti)

| Aspetto                          | Gestione Separata            | Gestione Artigiani/Commercianti |
| -------------------------------- | ---------------------------- | ------------------------------- |
| Contributo fisso minimo          | **No** — tutto proporzionale | Sì — ~€4.500/anno fisso         |
| Riduzione 35% regime forfettario | **No**                       | Sì                              |
| Calcolo su                       | Reddito effettivo            | Reddito effettivo + minimale    |
| Scadenze                         | 2 date (giugno/novembre)     | 4 rate trimestrali + 2 date     |

**Vantaggio:** se il reddito è basso, i contributi sono bassi in modo proporzionale. Nessun "minimo" da pagare anche a zero incassi.

### Formula contributi INPS

```
Contributi INPS = Fatturato × 78% × 26,07%
               = Fatturato × 20,33%  ← regola rapida (78% × 26,07%)
```

### Acconti INPS: struttura

Gli acconti INPS si calcolano con il **metodo storico** (default):
- Base di calcolo: **80%** dei contributi INPS dell'anno precedente
- Suddivisione: metà a giugno, metà a novembre

```
Acconto INPS totale = Contributi anno precedente × 80%
Primo acconto  (giugno 30)   = Contributi anno precedente × 40%
Secondo acconto (novembre 30) = Contributi anno precedente × 40%
```

Il **saldo** (differenza tra contributi effettivi e gli 80% versati) viene pagato il 30 giugno dell'anno successivo.

---

## 4. Imposta Sostitutiva

### Aliquote

| Condizione                                                                           | Aliquota |
| ------------------------------------------------------------------------------------ | -------- |
| Attività ordinaria                                                                   | **15%**  |
| Nuova attività (primi 5 anni, se non si aveva P.IVA precedente nello stesso settore) | **5%**   |

### Acconti imposta sostitutiva: struttura

Gli acconti si calcolano su **100%** dell'imposta dell'anno precedente, con metodo storico:

```
Primo acconto  (giugno 30)    = Imposta anno precedente × 40%
Secondo acconto (novembre 30) = Imposta anno precedente × 60%
```

### Soglie per gli acconti imposta sostitutiva

| Imposta dovuta anno precedente | Comportamento                                |
| ------------------------------ | -------------------------------------------- |
| < €52                          | Nessun acconto dovuto                        |
| €52 – €257,52                  | Unico acconto: 100% entro il **30 novembre** |
| > €257,52                      | Due rate: 40% a giugno + 60% a novembre      |

### Primo anno: esenzione acconti

Se è il **primo anno di attività** (o primo anno nel regime forfettario), non si pagano acconti nell'anno stesso perché non esiste un anno precedente di riferimento. Si paga solo il saldo a giugno dell'anno successivo.

---

## 5. Struttura dei Pagamenti: Acconti e Saldo

### Visione a T (anno N stabilizzato)

```
ANNO N (nel corso dell'anno)
  → Nessun pagamento durante l'anno

30 GIUGNO ANNO N+1 (scadenza principale)
  ┌─────────────────────────────────────────┐
  │  INPS: Saldo anno N                     │  = INPS_N − acconti_INPS_già_pagati
  │  INPS: Primo acconto anno N+1           │  = INPS_(N-1) × 40%
  │  Imposta: Saldo anno N                  │  = Imposta_N − acconti_già_pagati
  │  Imposta: Primo acconto anno N+1        │  = Imposta_(N-1) × 40%
  └─────────────────────────────────────────┘

30 NOVEMBRE ANNO N+1
  ┌─────────────────────────────────────────┐
  │  INPS: Secondo acconto anno N+1         │  = INPS_(N-1) × 40%
  │  Imposta: Secondo acconto anno N+1      │  = Imposta_(N-1) × 60%
  └─────────────────────────────────────────┘
```

> **Importante:** a giugno si sovrappongono sempre saldo dell'anno precedente + primo acconto dell'anno corrente. Questo crea un "picco di cassa" significativo.

---

## 6. Scadenze e Codici F24

### Date

| Data                                  | Pagamento                                                            |
| ------------------------------------- | -------------------------------------------------------------------- |
| **30 giugno**                         | Saldo anno precedente (INPS + imposta) + Primo acconto anno corrente |
| **30 novembre**                       | Secondo acconto anno corrente                                        |
| *(31 luglio con maggiorazione 0,40%)* | Proroga possibile per saldo e primo acconto                          |

> Nel 2025, il Decreto Fiscale del 12 giugno 2025 ha posticipato la scadenza al **21 luglio 2025**.

### Codici tributo F24

| Pagamento                                | Codice Tributo                                   |
| ---------------------------------------- | ------------------------------------------------ |
| Imposta sostitutiva — primo acconto      | **1790**                                         |
| Imposta sostitutiva — secondo acconto    | **1791**                                         |
| Imposta sostitutiva — saldo              | **1792**                                         |
| INPS Gestione Separata — acconti e saldo | Sezione INPS con codice **PXX** (varia per tipo) |

### Rateizzazione

- **Saldo + primo acconto:** rateizzabile in rate mensili fino a novembre, con interessi di mora
- **Secondo acconto (novembre):** **non rateizzabile**

---

## 7. Scenari Concreti Multi-Annuali

### Parametri comuni agli esempi

- Coefficiente redditività: 78%
- Aliquota INPS: 26,07%
- Nessuna altra detrazione

---

### Scenario A — Primo Anno (€25.000 fatturato, aliquota 5%)

*Tipico: sviluppatore/consulente che apre P.IVA per la prima volta nel 2024*

**Calcolo 2024:**
```
Fatturato:              €25.000
Reddito imponibile:     €25.000 × 78% = €19.500
Contributi INPS dovuti: €19.500 × 26,07% = €5.084
Base imposta:           €19.500 − €0 = €19.500  ← nel primo anno non hai ancora versato contributi
Imposta sostitutiva:    €19.500 × 5% = €975
```

> ⚠️ **Primo anno e deducibilità INPS:** nel primo anno di attività in Gestione Separata, nessun contributo INPS è stato ancora versato (il saldo si paga a giugno dell'anno successivo). Pertanto la base imponibile per l'imposta sostitutiva coincide con il reddito imponibile lordo: **non c'è nulla da dedurre**. I contributi versati a giugno 2025 saranno deducibili dal reddito **2025**, secondo il principio di cassa.

**Cosa si paga e quando:**

| Data                        | Voce                           | Importo               |
| --------------------------- | ------------------------------ | --------------------- |
| 2024 (durante l'anno)       | Nessun pagamento               | €0                    |
| 30 giugno 2025              | Saldo INPS 2024                | €5.084                |
| 30 giugno 2025              | Saldo imposta sostitutiva 2024 | €975                  |
| 30 giugno 2025              | Primo acconto INPS 2025        | €5.084 × 40% = €2.034 |
| 30 giugno 2025              | Primo acconto imposta 2025     | €975 × 40% = €390     |
| **30 giugno 2025 TOTALE**   |                                | **€8.483**            |
| 30 novembre 2025            | Secondo acconto INPS 2025      | €5.084 × 40% = €2.034 |
| 30 novembre 2025            | Secondo acconto imposta 2025   | €975 × 60% = €585     |
| **30 novembre 2025 TOTALE** |                                | **€2.619**            |

> **Cash flow alert:** A giugno 2025 devi avere **€8.483** disponibili. Su €25.000 incassati nel 2024 è il **33,9%** del fatturato. Accantonare mensilmente ~**€707** durante il 2024 evita la sorpresa.

> **Nota sul secondo anno:** nella dichiarazione 2026 (redditi 2025), potrai finalmente dedurre i contributi INPS versati nel 2025 (saldo 2024 + acconti 2025 = €5.084 + €2.034 + €2.034 = €9.152). Questo ridurrà significativamente la base imponibile del 2025.

---

### Scenario B — Anno Consolidato (€35.000 fatturato, aliquota 15%)

*Professionista che opera da almeno 6 anni, 2024 stabile*

**Calcolo 2024:**
```
Fatturato:              €35.000
Reddito imponibile:     €35.000 × 78% = €27.300
Contributi INPS:        €27.300 × 26,07% = €7.117
Base imposta:           €27.300 − €7.117 = €20.183  (contributi 2023 pagati a giugno 2024)
Imposta sostitutiva:    €20.183 × 15% = €3.027
```

**Pagamenti giugno 2025** (saldo 2024 + acconti 2025, assumendo 2023 stesso livello):
```
Saldo INPS 2024:              €7.117 − (€7.117 × 80%) = €7.117 − €5.694 = €1.423
Primo acconto INPS 2025:      €7.117 × 40% = €2.847
Saldo imposta 2024:           €3.027 − (€3.027 × 100%) = −€0  (se reddito stabile, saldo ≈ 0)
Primo acconto imposta 2025:   €3.027 × 40% = €1.211
TOTALE giugno 2025:           €5.481
```

**Pagamenti novembre 2025:**
```
Secondo acconto INPS 2025:    €7.117 × 40% = €2.847
Secondo acconto imposta 2025: €3.027 × 60% = €1.816
TOTALE novembre 2025:         €4.663
```

**Carico annuo 2025 (per reddito stabile):**

| Voce                         | Importo     |
| ---------------------------- | ----------- |
| INPS totale                  | €7.117      |
| Imposta sostitutiva          | €3.027      |
| **Totale**                   | **€10.144** |
| In % del fatturato (€35.000) | **29,0%**   |

---

### Scenario C — Reddito in Crescita (€20.000 → €35.000)

*Professionista che nel 2023 guadagnava €20.000 e nel 2024 sale a €35.000*

**Calcolo contributi:**

| Anno | Fatturato | Reddito imp. | INPS (26,07%) | Imposta base            | Imposta (15%) |
| ---- | --------- | ------------ | ------------- | ----------------------- | ------------- |
| 2023 | €20.000   | €15.600      | €4.067        | €15.600−€4.067=€11.533  | €1.730        |
| 2024 | €35.000   | €27.300      | €7.117        | €27.300−€4.067*=€23.233 | €3.485        |

*Si deducono i contributi 2023 pagati a giugno 2024 (€4.067), non quelli 2024.

**Pagamenti giugno 2025** (saldo 2024 + acconti 2025):
```
Acconti INPS già pagati per 2024:   €4.067 × 80% = €3.254 (giugno+novembre 2024)
Saldo INPS 2024:                    €7.117 − €3.254 = €3.863  ← alta perché il reddito è cresciuto
Primo acconto INPS 2025:            €7.117 × 40% = €2.847

Acconti imposta già pagati per 2024: €1.730 × 100% = €1.730 (40%+60% nel 2024)
Saldo imposta 2024:                  €3.485 − €1.730 = €1.755  ← alta per la stessa ragione
Primo acconto imposta 2025:          €3.485 × 40% = €1.394

TOTALE giugno 2025:   €3.863 + €2.847 + €1.755 + €1.394 = €9.859
```

> **Lezione:** quando il reddito cresce significativamente, il saldo a giugno è alto perché gli acconti dell'anno precedente erano calibrati sul reddito inferiore. Occorre accantonare di più durante l'anno di crescita.

---

### Scenario D — Reddito in Calo (€40.000 → €25.000)

*Professionista che nel 2023 guadagnava €40.000 e nel 2024 scende a €25.000*

**Calcolo contributi:**

| Anno | Fatturato | Reddito imp. | INPS   | Imposta                          |
| ---- | --------- | ------------ | ------ | -------------------------------- |
| 2023 | €40.000   | €31.200      | €8.134 | €31.200−€8.134=€23.066 → €3.460  |
| 2024 | €25.000   | €19.500      | €5.084 | €19.500−€8.134*=€11.366 → €1.705 |

*Contributi 2023 deducibili nel 2024 (pagati a giugno 2024).

**Pagamenti giugno 2025:**
```
Acconti INPS pagati per 2024:    €8.134 × 80% = €6.507
Saldo INPS 2024:                 €5.084 − €6.507 = −€1.423  ← CREDITO! Rimborsabile o compensabile

Acconti imposta pagati per 2024: €3.460 × 100% = €3.460
Saldo imposta 2024:              €1.705 − €3.460 = −€1.755  ← CREDITO!

Primo acconto INPS 2025:         €5.084 × 40% = €2.034
Primo acconto imposta 2025:      €1.705 × 40% = €682

TOTALE da pagare giugno 2025:    €2.034 + €682 = €2.716
CREDITI da dichiarazione:         €1.423 + €1.755 = €3.178 (usabili in compensazione F24)
```

> **Quando il metodo previsionale conviene:** Se già a giugno 2024 prevedi il calo, puoi usare il metodo previsionale e ridurre gli acconti, evitando di anticipare denaro che poi ti verrà rimborsato mesi dopo. Rischio: se sbagli la previsione al ribasso, paghi sanzioni.

---

### Scenario E — Reddito Basso (€10.000 fatturato)

*Attività parziale o avviamento lento*

**Calcolo 2024:**
```
Fatturato:              €10.000
Reddito imponibile:     €10.000 × 78% = €7.800
Contributi INPS:        €7.800 × 26,07% = €2.033
Base imposta:           €7.800 − €2.033 = €5.767
Imposta sostitutiva:    €5.767 × 15% = €865
```

**Soglia acconti imposta:** €865 > €257,52 → due rate normali.

**Accantonamento mensile consigliato:** (€2.033 + €865) / 12 = **€241/mese**

> Nessun minimale INPS → se fatturi poco, paghi poco. Questo è il principale vantaggio della Gestione Separata rispetto alla Gestione Artigiani.

---

## 8. Metodo Storico vs Previsionale

### Metodo Storico (default, sicuro)

- Base: anno precedente effettivo
- INPS: 80% del precedente
- Imposta: 100% del precedente
- **Nessuna sanzione** anche se l'anno corrente è più alto

### Metodo Previsionale (rischioso, a volte conveniente)

- Puoi pagare acconti basati sul tuo **stima del reddito corrente**
- Conveniente se il 2025 sarà significativamente peggiore del 2024
- **Rischio:** se sottostimi, paghi sanzioni + interessi sulla differenza non versata

### Esempio metodo previsionale

```
2024 effettivo: €35.000 fatturato → imposta €3.027 → INPS €7.117
2025 previsto:  €20.000 fatturato → imposta €1.705 → INPS €5.084

Con metodo storico:
  Acconti imposta 2025: €3.027 × 100% = €3.027
  Acconti INPS 2025:    €7.117 × 80% = €5.694

Con metodo previsionale (se ci si fida della previsione):
  Acconti imposta 2025: €1.705 × 100% = €1.705  ← risparmio di €1.322
  Acconti INPS 2025:    €5.084 × 80% = €4.067   ← risparmio di €1.627
  Risparmio totale:      €2.949 (ma a rischio sanzione se sbaglio)
```

**Strategia pragmatica:** pagare il primo acconto (giugno) col metodo storico; poi, se il reddito è chiaramente in calo, applicare il previsionale al secondo acconto (novembre). Riduce il rischio mantenendo la flessibilità.

---

## 9. Errori Comuni e Trappole

### 1. Non accantonare durante l'anno
Il regime forfettario non prevede ritenute alla fonte. Nessuno trattiene nulla mentre incassi. Devi farlo tu. Regola pratica: accantonare il **28-32%** di ogni incasso (varia con aliquota 5% vs 15%).

### 2. Confondere contributi competenti con contributi versati
I contributi INPS del 2024 vengono **pagati a giugno 2025**. Sono deducibili dal reddito del **2025** (anno in cui vengono versati), non del 2024. Questo sfasa la deduzione di un anno, soprattutto nel primo anno di attività.

### 3. Dimenticare il saldo INPS a giugno
A giugno si paga: saldo INPS anno precedente + primo acconto INPS anno corrente + saldo imposta + primo acconto imposta. Il picco di cassa può superare il 35% del fatturato annuo se non si è accantonato.

### 4. Usare il metodo previsionale senza certezza
Se usi il previsionale e poi fatturi di più del previsto, paghi sanzioni del 30% sulla differenza + interessi. Usalo solo con dati concreti (es. contratti già terminati, cliente perso).

### 5. Credere che la Gestione Separata abbia un minimale
Non ce l'ha (a differenza di artigiani e commercianti). Ma questo significa anche che accrediti meno contribuzione pensionistica nei periodi di basso reddito.

### 6. Non verificare il codice ATECO
Il coefficiente di redditività dipende dal codice ATECO. Alcune attività miste (es. consulenza + vendita software) potrebbero applicare coefficienti diversi per porzioni diverse del fatturato.

---

## Appendice: Tabella Accantonamento Mensile Rapido

| Fatturato mensile | INPS mensile | Imposta (15%) mensile | Imposta (5%) mensile | Tot. 15%   | Tot. 5%    |
| ----------------- | ------------ | --------------------- | -------------------- | ---------- | ---------- |
| €1.000            | €203         | €87                   | €29                  | **€290**   | **€232**   |
| €2.000            | €407         | €173                  | €58                  | **€580**   | **€465**   |
| €3.000            | €610         | €260                  | €87                  | **€870**   | **€697**   |
| €4.000            | €813         | €347                  | €116                 | **€1.160** | **€929**   |
| €5.000            | €1.017       | €433                  | €144                 | **€1.450** | **€1.161** |
| €6.000            | €1.220       | €520                  | €173                 | **€1.740** | **€1.393** |
| €7.000            | €1.423       | €607                  | €202                 | **€2.030** | **€1.625** |

*Calcolo: fatturato × 78% = reddito; reddito × 26,07% = INPS; (reddito − INPS) × 15% o 5% = imposta.*

---

## Fonti

- [Quickfisco — Calcolo acconti saldo regime forfettario](https://quickfisco.it/blog/calcolo-acconti-saldo-regime-forfettario-scadenze-esempi/)
- [Quickfisco — Gestione Separata INPS per forfettari](https://quickfisco.it/blog/regime-forfettario/calcolo-gestione-separata-inps-esempi-regime-forfettario/)
- [Regime-Forfettario.it — Acconti e saldo: calendario e calcoli pratici](https://www.regime-forfettario.it/acconti-e-saldo-nel-forfettario-calendario-e-calcoli-pratici/)
- [Regime-Forfettario.it — Versamento imposta e acconti](https://www.regime-forfettario.it/versamento-imposta-acconti-regime-forfettario/)
- [Agenzia delle Entrate — Come si paga l'Irpef (Professionisti)](https://www.agenziaentrate.gov.it/portale/come-si-paga-l-irpef6)
- [TaxMan — Calcolo contributi INPS regime forfettario](https://www.taxmanapp.it/blog/2025/02/21/calcolo-contributi-inps-in-regime-forfettario2022/)
- [TaxMan — Scadenze fiscali 2025 liberi professionisti](https://www.taxmanapp.it/blog/2025/03/12/scadenze-fiscali-2025-liberi-professionisti-in-regime-forfettario/)
- [FattureInCloud — Contributi INPS regime forfettario](https://www.fattureincloud.it/glossario/regime-forfettario/contributi-inps/)
- [Studio Carminati — Primo anno gestione separata](https://studiocarminati.net/regime-forfettario-e-gestione-separata-inps-quanto-si-paga-il-primo-anno/)
- [Studio Fantoni — Scadenze fiscali forfettario](https://www.studiofantoni.it/scadenze-fiscali-forfettario.html)
- [Fiscomania — Acconti di imposta forfettario](https://fiscomania.com/regime-forfetario-gli-acconti-imposta/)
- [FiscoZen — Contributi INPS regime forfettario](https://www.fiscozen.it/guide/regime-forfettario-contributi-inps/)
