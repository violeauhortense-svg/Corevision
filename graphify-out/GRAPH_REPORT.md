# Graph Report - Corevision-main  (2026-07-20)

## Corpus Check
- 293 files · ~292,581 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1346 nodes · 1775 edges · 39 communities detected
- Extraction: 84% EXTRACTED · 16% INFERRED · 0% AMBIGUOUS · INFERRED: 283 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 84|Community 84]]

## God Nodes (most connected - your core abstractions)
1. `getByPrefix()` - 45 edges
2. `DocumentsStore` - 26 edges
3. `del()` - 19 edges
4. `getSession()` - 18 edges
5. `delByPrefix()` - 16 edges
6. `StatsStore` - 15 edges
7. `analyserProfilClient()` - 14 edges
8. `RulesStore` - 14 edges
9. `ClientsStore` - 13 edges
10. `MontagesStore` - 12 edges

## Surprising Connections (you probably didn't know these)
- `getByPrefix()` --calls--> `getSimulationsClient()`  [INFERRED]
  src\app\backend\kv_store.tsx → src\app\backend\simulateur_patrimonial.tsx
- `getByPrefix()` --calls--> `getSimulateurStats()`  [INFERRED]
  src\app\backend\kv_store.tsx → src\app\backend\simulateur_patrimonial.tsx
- `collecterDonneesClient()` --calls--> `getByPrefix()`  [INFERRED]
  src\app\backend\audit_patrimonial.tsx → src\app\backend\kv_store.tsx
- `analyserCivil()` --calls--> `getReglesParDomaine()`  [INFERRED]
  src\app\backend\audit_patrimonial.tsx → src\app\backend\regles_fiscales_db.tsx
- `analyserFiscal()` --calls--> `rechercherRegles()`  [INFERRED]
  src\app\backend\audit_patrimonial.tsx → src\app\backend\regles_fiscales_db.tsx

## Communities

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (54): getAuditsClient(), getCollecteStats(), getReglesCollectees(), runCollecte(), scheduleWeeklyCollecte(), scrapeBOFiP(), scrapeLegifrance(), searchDocuments() (+46 more)

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (44): App(), setupAuditPatrimonialRoutes(), initBaremes2026(), setupBaremesRoutes(), setupBilanRoutes(), setupClientRoutes(), collecterDocumentsRetraite(), getDocumentsRetraite() (+36 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (35): handleAdminValidation(), handleDocumentsUpdate(), handleSwitchTab(), loadClientData(), reloadDocuments(), checkAuditProgress(), handleOrderValidated(), loadData() (+27 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (24): analyserCivil(), analyserFiscal(), analyserPatrimoine(), analyserSocial(), collecterDonneesClient(), genererAuditComplet(), genererRapportLive(), getAudit() (+16 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (19): getMeetingsForDate(), getTasksForDate(), getTodayItems(), handleCreateMeeting(), loadAgendaData(), toggleMeeting(), toggleTask(), completeTask() (+11 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (15): genererRapport(), handleRunAudit(), handleCreateClient(), handleDeleteClient(), async(), handleTaskUpdate(), loadClient(), saveArbitrageFields() (+7 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (22): extraireRegleDepuisChunk(), extraireToutesLesRegles(), getExtractionStats(), identifierConditions(), identifierConsequences(), identifierExceptions(), identifierRegle(), setupExtracteurReglesRoutes() (+14 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (13): calculateValorisation(), getAnalyseSituation(), getBFR(), getComptesAssocies(), getCouvertureBFR(), getFinancementParAssocies(), getTotalActif(), getTotalPassif() (+5 more)

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (24): setupMontagesPatrimoniauxRoutes(), analyserProfilClient(), calculerNbParts(), calculerRevenusTotaux(), construireRequeteRegles(), determinerTrancheMarginalIR(), estimerEconomiesFiscales(), genererExplicationIA() (+16 more)

### Community 9 - "Community 9"
Cohesion: 0.07
Nodes (13): handleReinitialiser(), handleSubmit(), handleSubmit(), confirmAction(), getGraviteBadge(), getStatutBadge(), handleSubmit(), handleSave() (+5 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (24): setupCollecteurJuridiqueRoutes(), calculerCompatibilite(), estimerEconomie(), genererEtapesMontage(), genererMontageDepuisRegles(), genererMontagesAutomatiques(), genererNomMontage(), genererObjectif() (+16 more)

### Community 11 - "Community 11"
Cohesion: 0.1
Nodes (7): handleDeleteOrder(), updateOrderStatus(), CalculServiceClass, getCacheKey(), getFromCache(), setCache(), CoreVisionServiceClass

### Community 12 - "Community 12"
Cohesion: 0.19
Nodes (18): base64url(), base64urlDecode(), createUser(), hashPassword(), signInUser(), signJWT(), verifyAuth(), verifyAuthFromCookie() (+10 more)

### Community 13 - "Community 13"
Cohesion: 0.14
Nodes (10): handleInitialiserRegles(), handleInitialiserReglesRetraite(), handleInitialiserReglesSociales(), handleLaunchCollecte(), handleLaunchCollecteRetraite(), handleLaunchCollecteSocial(), loadReglesCollectees(), loadReglesRetraite() (+2 more)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (9): detecterIncoherences(), extraireDonneesDetection(), extraireDonneesClient(), genererRecommandations(), calculateAge(), removeChild(), downloadReport(), generateReportContent() (+1 more)

### Community 15 - "Community 15"
Cohesion: 0.11
Nodes (3): handleSendRequest(), handleSendProposal(), recordEmailHistory()

### Community 16 - "Community 16"
Cohesion: 0.15
Nodes (2): EventEmitter, useTaskEvents()

### Community 17 - "Community 17"
Cohesion: 0.18
Nodes (8): isSCI(), handleOptimiser(), SimulationsProjections(), calculerIR(), calculerPlafondDividendesTNS(), calculerScenario(), formatEuro(), optimiserRemuneration()

### Community 18 - "Community 18"
Cohesion: 0.16
Nodes (3): addLog(), handleIndexDocument(), loadDocuments()

### Community 19 - "Community 19"
Cohesion: 0.26
Nodes (1): ClientsStore

### Community 21 - "Community 21"
Cohesion: 0.24
Nodes (5): calculerMontantDevis(), genererDevis(), handleOpenDetail(), handleToggleObjectif(), isObjectifSelected()

### Community 23 - "Community 23"
Cohesion: 0.2
Nodes (3): loadMetrics(), loadKanban(), getAuthToken()

### Community 24 - "Community 24"
Cohesion: 0.22
Nodes (2): SidebarMenuButton(), useSidebar()

### Community 26 - "Community 26"
Cohesion: 0.25
Nodes (2): handleEmailClick(), handleMarkAsRead()

### Community 28 - "Community 28"
Cohesion: 0.33
Nodes (6): handleDeleteDocument(), handleFileUpload(), loadDocuments(), deleteRequestedDocument(), getRequestedDocuments(), uploadRequestedDocument()

### Community 29 - "Community 29"
Cohesion: 0.42
Nodes (7): validateClientData(), validateDate(), validateEmail(), validateName(), validateNumericField(), validatePatrimoineItem(), validatePhone()

### Community 30 - "Community 30"
Cohesion: 0.29
Nodes (2): calculerRevenuFoncier(), calculerValeursAutomatiques()

### Community 31 - "Community 31"
Cohesion: 0.29
Nodes (2): chargerParametresDefaut(), handleMontageChange()

### Community 34 - "Community 34"
Cohesion: 0.52
Nodes (6): chargerOuCreerDossier(), genererSection(), initialiserPrompts(), modifierContenuSection(), sauvegarderDossier(), validerDossier()

### Community 40 - "Community 40"
Cohesion: 0.48
Nodes (5): calculerIFI(), calculerImpotRevenu(), calculerPrelevementsSociaux(), getDefaultBaremes(), loadBaremes()

### Community 41 - "Community 41"
Cohesion: 0.62
Nodes (6): generateDetentionSummary(), getDetentionContext(), isAcquisitionAvantMariage(), isRegimeCommunautaire(), isRegimeSeparatiste(), validateDetention()

### Community 42 - "Community 42"
Cohesion: 0.47
Nodes (3): resetToDefault(), saveEdit(), saveRegles()

### Community 46 - "Community 46"
Cohesion: 0.53
Nodes (4): FormControl(), FormDescription(), FormMessage(), useFormField()

### Community 50 - "Community 50"
Cohesion: 0.6
Nodes (3): extractImports(), getDomain(), scanFiles()

### Community 52 - "Community 52"
Cohesion: 0.5
Nodes (2): loadMeetings(), toggleMeetingCompleted()

### Community 56 - "Community 56"
Cohesion: 0.5
Nodes (2): CarouselNext(), useCarousel()

### Community 64 - "Community 64"
Cohesion: 0.67
Nodes (2): checkFile(), getDomain()

### Community 68 - "Community 68"
Cohesion: 0.67
Nodes (2): getSession(), handleReportGenerated()

### Community 84 - "Community 84"
Cohesion: 0.67
Nodes (2): createTasksForClient(), ensureClientTasks()

## Knowledge Gaps
- **Thin community `Community 16`** (18 nodes): `eventEmitter.ts`, `taskEvents.ts`, `EventEmitter`, `.clearHistory()`, `.createEvent()`, `.emit()`, `.getAllEvents()`, `.getClientEvents()`, `.loadFromLocalStorage()`, `.off()`, `.on()`, `.onAny()`, `.saveToLocalStorage()`, `emitTaskCreated()`, `emitTaskDeleted()`, `emitTasksBulkUpdated()`, `emitTaskUpdated()`, `useTaskEvents()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (13 nodes): `ClientsStore`, `.deleteAllClients()`, `.deleteClient()`, `.getActiveClientCount()`, `.getAllClients()`, `.getClient()`, `.getClientByEmail()`, `.getClientCount()`, `.getClientsByStatus()`, `.permanentlyDeleteClient()`, `.searchClients()`, `.storeClient()`, `.updateClientStatus()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (10 nodes): `sidebar.tsx`, `cn()`, `handleKeyDown()`, `SidebarFooter()`, `SidebarHeader()`, `SidebarMenu()`, `SidebarMenuButton()`, `SidebarMenuItem()`, `SidebarSeparator()`, `useSidebar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (9 nodes): `filterEmails()`, `formatDate()`, `handleArchive()`, `handleDelete()`, `handleEmailClick()`, `handleMarkAsRead()`, `handleMarkAsUnread()`, `loadEmails()`, `MailInboxTab.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (8 nodes): `calculerRevenuFoncier()`, `calculerValeursAutomatiques()`, `getBeneficiaireNom()`, `getBeneficiairesDisponibles()`, `handleAddRevenu()`, `handleDeleteRevenu()`, `handleSave()`, `RevenusImpositionForm.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (8 nodes): `chargerMontages()`, `chargerParametresDefaut()`, `comparerScenarios()`, `formatCurrency()`, `formatPercent()`, `handleMontageChange()`, `lancerSimulation()`, `SimulateurPatrimonial.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (5 nodes): `getLocationIcon()`, `getMeetingTypeColor()`, `loadMeetings()`, `toggleMeetingCompleted()`, `ClientMeetings.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (5 nodes): `carousel.tsx`, `Carousel()`, `CarouselNext()`, `cn()`, `useCarousel()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (4 nodes): `checkFile()`, `getAllFiles()`, `getDomain()`, `check-domains.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (4 nodes): `getSession()`, `handleReportGenerated()`, `loadClientData()`, `GelAvoirsTask.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 84`** (4 nodes): `ensureClientTasks.ts`, `createTasksForClient()`, `ensureClientTasks()`, `reloadClientTasks()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getSession()` connect `Community 2` to `Community 11`, `Community 12`, `Community 14`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `verifyAuthFromCookie()` connect `Community 12` to `Community 2`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `getByPrefix()` connect `Community 0` to `Community 1`, `Community 3`, `Community 6`, `Community 8`, `Community 10`, `Community 19`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Are the 43 inferred relationships involving `getByPrefix()` (e.g. with `getAuditsClient()` and `.getAllClients()`) actually correct?**
  _`getByPrefix()` has 43 INFERRED edges - model-reasoned connections that need verification._
- **Are the 17 inferred relationships involving `del()` (e.g. with `.permanentlyDeleteClient()` and `.deleteChunk()`) actually correct?**
  _`del()` has 17 INFERRED edges - model-reasoned connections that need verification._
- **Are the 16 inferred relationships involving `getSession()` (e.g. with `verifyAuthFromCookie()` and `loadData()`) actually correct?**
  _`getSession()` has 16 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `delByPrefix()` (e.g. with `.deleteAllClients()` and `.deleteAllChunks()`) actually correct?**
  _`delByPrefix()` has 14 INFERRED edges - model-reasoned connections that need verification._