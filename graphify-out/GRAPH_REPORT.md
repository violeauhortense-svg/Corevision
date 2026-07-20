# Graph Report - Corevision-main  (2026-07-20)

## Corpus Check
- 293 files · ~294,359 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1346 nodes · 1778 edges · 38 communities detected
- Extraction: 84% EXTRACTED · 16% INFERRED · 0% AMBIGUOUS · INFERRED: 285 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 82|Community 82]]

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
- `rechercherStrategies()` --calls--> `getAllMontages()`  [INFERRED]
  src\app\backend\audit_patrimonial.tsx → src\app\backend\montages_core.tsx
- `getAuditsClient()` --calls--> `getByPrefix()`  [INFERRED]
  src\app\backend\audit_patrimonial.tsx → src\app\backend\kv_store.tsx

## Communities

### Community 0 - "Community 0"
Cohesion: 0.02
Nodes (84): App(), getAuditsClient(), initBaremes2026(), setupBaremesRoutes(), getCollecteStats(), getReglesCollectees(), runCollecte(), scheduleWeeklyCollecte() (+76 more)

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (30): base64url(), base64urlDecode(), createUser(), hashPassword(), signInUser(), signJWT(), verifyAuth(), verifyAuthFromCookie() (+22 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (35): handleAdminValidation(), handleDocumentsUpdate(), handleSwitchTab(), loadClientData(), reloadDocuments(), checkAuditProgress(), handleOrderValidated(), loadData() (+27 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (35): analyserCivil(), analyserFiscal(), analyserPatrimoine(), analyserSocial(), collecterDonneesClient(), genererAuditComplet(), genererRapportLive(), getAudit() (+27 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (13): setupAuditPatrimonialRoutes(), ClientsStore, detecterIncoherences(), extraireDonneesDetection(), setupIncoherencesRoutes(), extraireDonneesClient(), genererRecommandations(), setupRecommandationsRoutes() (+5 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (19): getMeetingsForDate(), getTasksForDate(), getTodayItems(), handleCreateMeeting(), loadAgendaData(), toggleMeeting(), toggleTask(), completeTask() (+11 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (15): genererRapport(), handleRunAudit(), handleCreateClient(), handleDeleteClient(), async(), handleTaskUpdate(), loadClient(), saveArbitrageFields() (+7 more)

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
Cohesion: 0.1
Nodes (7): handleDeleteOrder(), updateOrderStatus(), CalculServiceClass, getCacheKey(), getFromCache(), setCache(), CoreVisionServiceClass

### Community 11 - "Community 11"
Cohesion: 0.14
Nodes (10): handleInitialiserRegles(), handleInitialiserReglesRetraite(), handleInitialiserReglesSociales(), handleLaunchCollecte(), handleLaunchCollecteRetraite(), handleLaunchCollecteSocial(), loadReglesCollectees(), loadReglesRetraite() (+2 more)

### Community 12 - "Community 12"
Cohesion: 0.18
Nodes (9): setupBilanRoutes(), sendDERSignatureEmail(), EmailServiceFactory, getEmailService(), StubEmailService, wrapEmailHtml(), sendCGPNotificationEmail(), sendSignatureEmail() (+1 more)

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (2): EventEmitter, useTaskEvents()

### Community 14 - "Community 14"
Cohesion: 0.11
Nodes (3): handleSendRequest(), handleSendProposal(), recordEmailHistory()

### Community 15 - "Community 15"
Cohesion: 0.2
Nodes (12): creerMontage(), deleteAllMontages(), deleteMontage(), getAllMontages(), getAllTags(), getAllTemplates(), getMontage(), getMontagesStats() (+4 more)

### Community 16 - "Community 16"
Cohesion: 0.18
Nodes (8): isSCI(), handleOptimiser(), SimulationsProjections(), calculerIR(), calculerPlafondDividendesTNS(), calculerScenario(), formatEuro(), optimiserRemuneration()

### Community 17 - "Community 17"
Cohesion: 0.26
Nodes (13): calculerCompatibilite(), estimerEconomie(), genererEtapesMontage(), genererMontageDepuisRegles(), genererMontagesAutomatiques(), genererNomMontage(), genererObjectif(), genererProfilsCibles() (+5 more)

### Community 18 - "Community 18"
Cohesion: 0.16
Nodes (3): addLog(), handleIndexDocument(), loadDocuments()

### Community 20 - "Community 20"
Cohesion: 0.24
Nodes (5): calculerMontantDevis(), genererDevis(), handleOpenDetail(), handleToggleObjectif(), isObjectifSelected()

### Community 22 - "Community 22"
Cohesion: 0.2
Nodes (3): loadMetrics(), loadKanban(), getAuthToken()

### Community 23 - "Community 23"
Cohesion: 0.22
Nodes (2): SidebarMenuButton(), useSidebar()

### Community 24 - "Community 24"
Cohesion: 0.25
Nodes (2): handleEmailClick(), handleMarkAsRead()

### Community 26 - "Community 26"
Cohesion: 0.33
Nodes (6): handleDeleteDocument(), handleFileUpload(), loadDocuments(), deleteRequestedDocument(), getRequestedDocuments(), uploadRequestedDocument()

### Community 27 - "Community 27"
Cohesion: 0.42
Nodes (7): validateClientData(), validateDate(), validateEmail(), validateName(), validateNumericField(), validatePatrimoineItem(), validatePhone()

### Community 28 - "Community 28"
Cohesion: 0.29
Nodes (2): calculerRevenuFoncier(), calculerValeursAutomatiques()

### Community 29 - "Community 29"
Cohesion: 0.29
Nodes (2): chargerParametresDefaut(), handleMontageChange()

### Community 32 - "Community 32"
Cohesion: 0.52
Nodes (6): chargerOuCreerDossier(), genererSection(), initialiserPrompts(), modifierContenuSection(), sauvegarderDossier(), validerDossier()

### Community 38 - "Community 38"
Cohesion: 0.48
Nodes (5): calculerIFI(), calculerImpotRevenu(), calculerPrelevementsSociaux(), getDefaultBaremes(), loadBaremes()

### Community 39 - "Community 39"
Cohesion: 0.62
Nodes (6): generateDetentionSummary(), getDetentionContext(), isAcquisitionAvantMariage(), isRegimeCommunautaire(), isRegimeSeparatiste(), validateDetention()

### Community 40 - "Community 40"
Cohesion: 0.47
Nodes (3): resetToDefault(), saveEdit(), saveRegles()

### Community 44 - "Community 44"
Cohesion: 0.53
Nodes (4): FormControl(), FormDescription(), FormMessage(), useFormField()

### Community 48 - "Community 48"
Cohesion: 0.6
Nodes (3): extractImports(), getDomain(), scanFiles()

### Community 50 - "Community 50"
Cohesion: 0.5
Nodes (2): loadMeetings(), toggleMeetingCompleted()

### Community 54 - "Community 54"
Cohesion: 0.5
Nodes (2): CarouselNext(), useCarousel()

### Community 62 - "Community 62"
Cohesion: 0.67
Nodes (2): checkFile(), getDomain()

### Community 66 - "Community 66"
Cohesion: 0.67
Nodes (2): getSession(), handleReportGenerated()

### Community 82 - "Community 82"
Cohesion: 0.67
Nodes (2): createTasksForClient(), ensureClientTasks()

## Knowledge Gaps
- **Thin community `Community 13`** (18 nodes): `eventEmitter.ts`, `taskEvents.ts`, `EventEmitter`, `.clearHistory()`, `.createEvent()`, `.emit()`, `.getAllEvents()`, `.getClientEvents()`, `.loadFromLocalStorage()`, `.off()`, `.on()`, `.onAny()`, `.saveToLocalStorage()`, `emitTaskCreated()`, `emitTaskDeleted()`, `emitTasksBulkUpdated()`, `emitTaskUpdated()`, `useTaskEvents()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (10 nodes): `sidebar.tsx`, `cn()`, `handleKeyDown()`, `SidebarFooter()`, `SidebarHeader()`, `SidebarMenu()`, `SidebarMenuButton()`, `SidebarMenuItem()`, `SidebarSeparator()`, `useSidebar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (9 nodes): `filterEmails()`, `formatDate()`, `handleArchive()`, `handleDelete()`, `handleEmailClick()`, `handleMarkAsRead()`, `handleMarkAsUnread()`, `loadEmails()`, `MailInboxTab.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (8 nodes): `calculerRevenuFoncier()`, `calculerValeursAutomatiques()`, `getBeneficiaireNom()`, `getBeneficiairesDisponibles()`, `handleAddRevenu()`, `handleDeleteRevenu()`, `handleSave()`, `RevenusImpositionForm.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (8 nodes): `chargerMontages()`, `chargerParametresDefaut()`, `comparerScenarios()`, `formatCurrency()`, `formatPercent()`, `handleMontageChange()`, `lancerSimulation()`, `SimulateurPatrimonial.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (5 nodes): `getLocationIcon()`, `getMeetingTypeColor()`, `loadMeetings()`, `toggleMeetingCompleted()`, `ClientMeetings.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (5 nodes): `carousel.tsx`, `Carousel()`, `CarouselNext()`, `cn()`, `useCarousel()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (4 nodes): `checkFile()`, `getAllFiles()`, `getDomain()`, `check-domains.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (4 nodes): `getSession()`, `handleReportGenerated()`, `loadClientData()`, `GelAvoirsTask.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 82`** (4 nodes): `ensureClientTasks.ts`, `createTasksForClient()`, `ensureClientTasks()`, `reloadClientTasks()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getSession()` connect `Community 2` to `Community 1`, `Community 10`, `Community 4`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `verifyAuthFromCookie()` connect `Community 1` to `Community 2`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `getByPrefix()` connect `Community 0` to `Community 3`, `Community 4`, `Community 8`, `Community 15`, `Community 17`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Are the 43 inferred relationships involving `getByPrefix()` (e.g. with `getAuditsClient()` and `.getAllClients()`) actually correct?**
  _`getByPrefix()` has 43 INFERRED edges - model-reasoned connections that need verification._
- **Are the 17 inferred relationships involving `del()` (e.g. with `.permanentlyDeleteClient()` and `.deleteChunk()`) actually correct?**
  _`del()` has 17 INFERRED edges - model-reasoned connections that need verification._
- **Are the 16 inferred relationships involving `getSession()` (e.g. with `verifyAuthFromCookie()` and `loadData()`) actually correct?**
  _`getSession()` has 16 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `delByPrefix()` (e.g. with `.deleteAllClients()` and `.deleteAllChunks()`) actually correct?**
  _`delByPrefix()` has 14 INFERRED edges - model-reasoned connections that need verification._