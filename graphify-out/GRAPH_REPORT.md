# Graph Report - Corevision-main  (2026-04-29)

## Corpus Check
- 261 files · ~254,282 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1171 nodes · 1474 edges · 37 communities detected
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 179 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 84|Community 84]]

## God Nodes (most connected - your core abstractions)
1. `get()` - 54 edges
2. `set()` - 29 edges
3. `getByPrefix()` - 29 edges
4. `getSession()` - 17 edges
5. `saveClientData()` - 14 edges
6. `analyserProfilClient()` - 14 edges
7. `EventEmitter` - 11 edges
8. `genererAuditComplet()` - 10 edges
9. `CalculServiceClass` - 9 edges
10. `Alert()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `initBaremes2026()` --calls--> `set()`  [INFERRED]
  src\app\supabase\functions\server\baremes_routes.tsx → src\app\supabase\functions\server\kv_store.tsx
- `setupCollecteurJuridiqueRoutes()` --calls--> `get()`  [INFERRED]
  src\app\supabase\functions\server\collecteur_juridique_routes.tsx → src\app\supabase\functions\server\kv_store.tsx
- `collecterDocumentsRetraite()` --calls--> `set()`  [INFERRED]
  src\app\supabase\functions\server\collecteur_retraite.tsx → src\app\supabase\functions\server\kv_store.tsx
- `collecterDocumentsURSSAF()` --calls--> `set()`  [INFERRED]
  src\app\supabase\functions\server\collecteur_social.tsx → src\app\supabase\functions\server\kv_store.tsx
- `getStatsCollecteSociale()` --calls--> `get()`  [INFERRED]
  src\app\supabase\functions\server\collecteur_social.tsx → src\app\supabase\functions\server\kv_store.tsx

## Communities

### Community 0 - "Community 0"
Cohesion: 0.04
Nodes (50): App(), setupAuditPatrimonialRoutes(), base64url(), base64urlDecode(), createUser(), hashPassword(), signInUser(), signJWT() (+42 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (48): getAuditsClient(), getCollecteStats(), getReglesCollectees(), runCollecte(), scheduleWeeklyCollecte(), scrapeBOFiP(), scrapeLegifrance(), searchDocuments() (+40 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (26): detectIncoh(), handleSaveAudit(), handleSavePreconisations(), handleSavePresentation(), handleValidateAndSend(), updateOrderData(), handleSaveQuestionnaire(), checkMigration() (+18 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (35): setupCoreVisionRoutes(), creerMontage(), deleteMontage(), getAllMontages(), getAllTags(), getMontage(), getMontagesStats(), importerMontages() (+27 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (13): calculateValorisation(), getAnalyseSituation(), getBFR(), getComptesAssocies(), getCouvertureBFR(), getFinancementParAssocies(), getTotalActif(), getTotalPassif() (+5 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (13): handleReinitialiser(), handleSubmit(), handleSubmit(), confirmAction(), getGraviteBadge(), getStatutBadge(), handleSubmit(), handleSave() (+5 more)

### Community 6 - "Community 6"
Cohesion: 0.1
Nodes (8): handleDeleteOrder(), updateOrderStatus(), CalculServiceClass, getCacheKey(), getFromCache(), setCache(), CacheManager, CoreVisionServiceClass

### Community 7 - "Community 7"
Cohesion: 0.14
Nodes (25): analyserCivil(), analyserFiscal(), analyserPatrimoine(), analyserSocial(), collecterDonneesClient(), genererAuditComplet(), genererRapportLive(), getAudit() (+17 more)

### Community 8 - "Community 8"
Cohesion: 0.1
Nodes (8): handleTaskUpdated(), handleToggleTask(), handleUpdateDueDate(), handleUpdateTask(), loadTasks(), EventEmitter, emitTaskUpdated(), useTaskEvents()

### Community 9 - "Community 9"
Cohesion: 0.15
Nodes (23): calcPatrimoine(), handleAdminValidation(), handleDocumentsUpdate(), handleSwitchTab(), handleUpdateActifs(), handleUpdateAuditRecommendations(), handleUpdateClient(), handleUpdateContactsProfessionnels() (+15 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (11): getMeetingsForDate(), getTasksForDate(), getTodayItems(), handleCreateMeeting(), loadAgendaData(), toggleMeeting(), toggleTask(), getAllTasks() (+3 more)

### Community 11 - "Community 11"
Cohesion: 0.14
Nodes (10): handleInitialiserRegles(), handleInitialiserReglesRetraite(), handleInitialiserReglesSociales(), handleLaunchCollecte(), handleLaunchCollecteRetraite(), handleLaunchCollecteSocial(), loadReglesCollectees(), loadReglesRetraite() (+2 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (9): calculateAge(), removeChild(), downloadReport(), generateReportContent(), performCheck(), detecterIncoherences(), extraireDonneesDetection(), extraireDonneesClient() (+1 more)

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (7): genererRapport(), handleCreateClient(), handleDeleteClient(), ClientServiceClass, getCached(), removeCache(), setCache()

### Community 14 - "Community 14"
Cohesion: 0.2
Nodes (14): setupCollecteurJuridiqueRoutes(), calculerCompatibilite(), estimerEconomie(), genererEtapesMontage(), genererMontageDepuisRegles(), genererMontagesAutomatiques(), genererNomMontage(), genererObjectif() (+6 more)

### Community 15 - "Community 15"
Cohesion: 0.16
Nodes (6): checkServerAndLoadClients(), handleClientStageChange(), handleTaskToggle(), initializeClientTasks(), loadClientsFromLocalStorage(), saveTasksToLocalStorage()

### Community 16 - "Community 16"
Cohesion: 0.18
Nodes (8): isSCI(), handleOptimiser(), SimulationsProjections(), calculerIR(), calculerPlafondDividendesTNS(), calculerScenario(), formatEuro(), optimiserRemuneration()

### Community 17 - "Community 17"
Cohesion: 0.16
Nodes (3): addLog(), handleIndexDocument(), loadDocuments()

### Community 18 - "Community 18"
Cohesion: 0.26
Nodes (8): deleteTaskHandler(), deleteTaskSync(), getAllTasks(), loadTasks(), toggleDocumentReceived(), toggleTask(), updateDeadline(), updateTask()

### Community 20 - "Community 20"
Cohesion: 0.29
Nodes (10): appelGPT4o(), appelGPT4oJSON(), analyseAvancee7Etapes(), etape1_normalisation(), etape2_diagnostic_factuel(), etape3_analyse_critique(), etape4_identification_enjeux(), etape5_strategies() (+2 more)

### Community 21 - "Community 21"
Cohesion: 0.24
Nodes (5): calculerMontantDevis(), genererDevis(), handleOpenDetail(), handleToggleObjectif(), isObjectifSelected()

### Community 23 - "Community 23"
Cohesion: 0.22
Nodes (2): SidebarMenuButton(), useSidebar()

### Community 25 - "Community 25"
Cohesion: 0.24
Nodes (3): checkAuditProgress(), handleOrderValidated(), loadData()

### Community 26 - "Community 26"
Cohesion: 0.33
Nodes (6): handleDeleteDocument(), handleFileUpload(), loadDocuments(), deleteRequestedDocument(), getRequestedDocuments(), uploadRequestedDocument()

### Community 27 - "Community 27"
Cohesion: 0.25
Nodes (2): handleEmailClick(), handleMarkAsRead()

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

### Community 43 - "Community 43"
Cohesion: 0.47
Nodes (3): handleCreateTaskFromObjectif(), handleCreateTaskFromRecommendation(), loadTasks()

### Community 47 - "Community 47"
Cohesion: 0.53
Nodes (4): FormControl(), FormDescription(), FormMessage(), useFormField()

### Community 53 - "Community 53"
Cohesion: 0.5
Nodes (2): loadMeetings(), toggleMeetingCompleted()

### Community 56 - "Community 56"
Cohesion: 0.5
Nodes (2): CarouselNext(), useCarousel()

### Community 67 - "Community 67"
Cohesion: 0.67
Nodes (2): getSession(), handleReportGenerated()

### Community 84 - "Community 84"
Cohesion: 0.67
Nodes (2): createTasksForClient(), ensureClientTasks()

## Knowledge Gaps
- **Thin community `Community 23`** (10 nodes): `sidebar.tsx`, `cn()`, `handleKeyDown()`, `SidebarFooter()`, `SidebarHeader()`, `SidebarMenu()`, `SidebarMenuButton()`, `SidebarMenuItem()`, `SidebarSeparator()`, `useSidebar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (9 nodes): `filterEmails()`, `formatDate()`, `handleArchive()`, `handleDelete()`, `handleEmailClick()`, `handleMarkAsRead()`, `handleMarkAsUnread()`, `loadEmails()`, `MailInboxTab.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (8 nodes): `calculerRevenuFoncier()`, `calculerValeursAutomatiques()`, `getBeneficiaireNom()`, `getBeneficiairesDisponibles()`, `handleAddRevenu()`, `handleDeleteRevenu()`, `handleSave()`, `RevenusImpositionForm.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (8 nodes): `chargerMontages()`, `chargerParametresDefaut()`, `comparerScenarios()`, `formatCurrency()`, `formatPercent()`, `handleMontageChange()`, `lancerSimulation()`, `SimulateurPatrimonial.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (5 nodes): `getLocationIcon()`, `getMeetingTypeColor()`, `loadMeetings()`, `toggleMeetingCompleted()`, `ClientMeetings.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (5 nodes): `carousel.tsx`, `Carousel()`, `CarouselNext()`, `cn()`, `useCarousel()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (4 nodes): `getSession()`, `handleReportGenerated()`, `loadClientData()`, `GelAvoirsTask.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 84`** (4 nodes): `ensureClientTasks.ts`, `createTasksForClient()`, `ensureClientTasks()`, `reloadClientTasks()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getSession()` connect `Community 2` to `Community 25`, `Community 12`, `Community 9`, `Community 6`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `get()` connect `Community 0` to `Community 1`, `Community 3`, `Community 6`, `Community 7`, `Community 8`, `Community 14`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Are the 52 inferred relationships involving `get()` (e.g. with `App()` and `getFromCache()`) actually correct?**
  _`get()` has 52 INFERRED edges - model-reasoned connections that need verification._
- **Are the 27 inferred relationships involving `set()` (e.g. with `setCache()` and `genererAuditComplet()`) actually correct?**
  _`set()` has 27 INFERRED edges - model-reasoned connections that need verification._
- **Are the 27 inferred relationships involving `getByPrefix()` (e.g. with `collecterDonneesClient()` and `getAuditsClient()`) actually correct?**
  _`getByPrefix()` has 27 INFERRED edges - model-reasoned connections that need verification._
- **Are the 15 inferred relationships involving `getSession()` (e.g. with `loadData()` and `handleSaveAudit()`) actually correct?**
  _`getSession()` has 15 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._